import "server-only";
import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { findStaff } from "./bookings";
import { db } from "./db";
import { HttpError, notConnected } from "./errors";

// Sign-in is Supabase Auth. Guests and staff are the same kind of Supabase
// user; what makes someone staff is a row in the staff table. The two sessions
// are kept in separate cookies, so a staff member can also be signed in as a
// guest in the same browser.

export type StaffUser = { email: string; name: string; role: "Administrator" | "Property staff" };
type Kind = "guest" | "staff";

const CLIENT = "kokoro_client";
const secure = process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV !== "production";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw notConnected("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishable) throw notConnected("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return { url, publishable };
}

/** A Supabase client whose session lives in this browser's cookies. */
async function sessionClient(kind: Kind): Promise<SupabaseClient> {
  const { url, publishable } = env();
  const jar = await cookies();
  return createServerClient(url, publishable, {
    cookieOptions: { name: `kokoro-${kind}` },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        // The browser never reads these, so scripts on the page can't either.
        for (const c of list) {
          jar.set(c.name, c.value, { ...c.options, httpOnly: true, secure, sameSite: "lax" });
        }
      },
    },
  });
}

const globalForAuth = globalThis as unknown as {
  kokoroAdmin?: SupabaseClient;
  kokoroPublic?: SupabaseClient;
};
const stateless = { auth: { persistSession: false, autoRefreshToken: false } };

/** Full-access client for managing users. Uses the secret key; server only. */
function adminClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw notConnected("SUPABASE_SECRET_KEY");
  return (globalForAuth.kokoroAdmin ??= createClient(env().url, secret, stateless));
}

/** Session-less client for emails whose links may be opened on any device. */
function publicClient(): SupabaseClient {
  const { url, publishable } = env();
  return (globalForAuth.kokoroPublic ??= createClient(url, publishable, stateless));
}

async function sessionEmail(kind: Kind): Promise<string | null> {
  const { data } = await (await sessionClient(kind)).auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

async function endSession(kind: Kind) {
  await (await sessionClient(kind)).auth.signOut({ scope: "local" });
}

/* ---------- Guests ---------- */

export const getGuestEmail = () => sessionEmail("guest");
export const endGuestSession = () => endSession("guest");

/** A one-time sign-in token for this email, creating the Supabase user if needed. */
async function guestToken(email: string) {
  const admin = adminClient().auth.admin;
  const created = await admin.createUser({ email, email_confirm: true });
  if (created.error && created.error.code !== "email_exists") throw created.error;
  const link = await admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;
  return { hash: link.data.properties.hashed_token, type: link.data.properties.verification_type };
}

/** Signs this browser in from a one-time token. False if it is used up or expired. */
export async function verifyGuestToken(hash: string, type: string): Promise<boolean> {
  const { error } = await (await sessionClient("guest")).auth.verifyOtp({ token_hash: hash, type });
  return !error;
}

/** Finishes a sign-in started in this same browser by an emailed link. */
export async function exchangeGuestCode(code: string): Promise<boolean> {
  const { error } = await (await sessionClient("guest")).auth.exchangeCodeForSession(code);
  return !error;
}

/** Signs the guest in straight after they book, with no email round trip. */
export async function startGuestSession(email: string) {
  const token = await guestToken(email);
  if (!(await verifyGuestToken(token.hash, token.type))) {
    throw new Error("Supabase did not accept the sign-in token it just issued.");
  }
}

/**
 * Sends the guest a sign-in link. In production Supabase emails it. In
 * development the link is returned instead, so it can be shown on screen
 * without an email provider.
 */
export async function sendGuestLink(email: string, origin: string): Promise<string | null> {
  const landing = `${origin}/api/auth/verify`;
  if (isDev) {
    const token = await guestToken(email);
    return `${landing}?token_hash=${token.hash}&type=${token.type}`;
  }
  const { error } = await (await sessionClient("guest")).auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: landing },
  });
  if (error) throw error;
  return null;
}

/* ---------- Staff ---------- */

export async function getStaff(): Promise<StaffUser | null> {
  const email = await sessionEmail("staff");
  return email ? findStaff(email) : null;
}

export const endStaffSession = () => endSession("staff");

const badCredentials = () =>
  new HttpError(401, "bad_credentials", "That email and password don't match a staff account.");

export async function staffSignIn(email: string, password: string) {
  // Same message for an unknown email, a wrong password and a non-staff account.
  if (!(await findStaff(email))) throw badCredentials();
  const { error } = await (await sessionClient("staff")).auth.signInWithPassword({ email, password });
  if (error) throw badCredentials();
}

const setPasswordUrl = (origin: string) => `${origin}/admin/set-password`;

/**
 * Emails a link for choosing a password: an invitation for someone new, a
 * reset for someone who already has a Supabase account (a past guest, say).
 */
export async function sendStaffInvite(email: string, origin: string) {
  const redirectTo = setPasswordUrl(origin);
  const invited = await adminClient().auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!invited.error) return;
  if (invited.error.code !== "email_exists") throw invited.error;
  const reset = await publicClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (reset.error) throw reset.error;
}

export async function sendStaffReset(email: string, origin: string) {
  const { error } = await publicClient().auth.resetPasswordForEmail(email, {
    redirectTo: setPasswordUrl(origin),
  });
  if (error) throw error;
}

/**
 * Sets a staff member's password using the access token from their invitation
 * or reset link, then signs them in.
 */
export async function setStaffPassword(accessToken: string, password: string) {
  const admin = adminClient().auth;
  const { data } = await admin.getUser(accessToken);
  const email = data.user?.email?.toLowerCase();
  if (!data.user || !email || !(await findStaff(email))) {
    throw new HttpError(
      401,
      "link_expired",
      "This link has expired or isn't for a staff account. Ask an administrator for a new one.",
    );
  }
  const updated = await admin.admin.updateUserById(data.user.id, { password });
  if (updated.error) {
    throw new HttpError(400, "weak_password", updated.error.message);
  }
  await staffSignIn(email, password);
}

/* ---------- Shared ---------- */

/** Anonymous browser id, so a guest's own hold never blocks their retry. */
export async function clientId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CLIENT)?.value;
  if (existing) return existing;
  const id = randomBytes(32).toString("base64url");
  jar.set(CLIENT, id, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 30 * 86_400 });
  return id;
}

/**
 * Stand-in for booking emails (confirmations, cancellations): stores the
 * message. Supabase only sends sign-in emails, so swap this for a real email
 * provider.
 */
export async function sendEmail(recipient: string, subject: string, body: string) {
  await db()`insert into outbox (recipient, subject, body) values (${recipient}, ${subject}, ${body})`;
}
