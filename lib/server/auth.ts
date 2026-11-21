import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const GUEST = "kokoro_guest";
const STAFF = "kokoro_staff";
const CLIENT = "kokoro_client";
const DAY = 86_400_000;

export type StaffUser = { email: string; name: string; role: "Administrator" | "Property staff" };

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

const cookieOptions = (maxAgeDays: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeDays * 86_400,
});

/** Only the hash of a session token is stored, so a database leak can't sign anyone in. */
async function startSession(kind: "guest" | "staff", email: string, days: number) {
  const token = newToken();
  db.prepare(
    "INSERT INTO sessions (token_hash, kind, email, expires_at) VALUES (?, ?, ?, ?)",
  ).run(sha(token), kind, email, Date.now() + days * DAY);
  (await cookies()).set(kind === "guest" ? GUEST : STAFF, token, cookieOptions(days));
}

async function sessionEmail(kind: "guest" | "staff"): Promise<string | null> {
  const token = (await cookies()).get(kind === "guest" ? GUEST : STAFF)?.value;
  if (!token) return null;
  const row = db
    .prepare("SELECT email FROM sessions WHERE token_hash = ? AND kind = ? AND expires_at > ?")
    .get(sha(token), kind, Date.now()) as { email: string } | undefined;
  return row?.email ?? null;
}

async function endSession(kind: "guest" | "staff") {
  const jar = await cookies();
  const name = kind === "guest" ? GUEST : STAFF;
  const token = jar.get(name)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(name);
}

export const startGuestSession = (email: string) => startSession("guest", email, 30);
export const startStaffSession = (email: string) => startSession("staff", email, 1);
export const getGuestEmail = () => sessionEmail("guest");
export const endGuestSession = () => endSession("guest");
export const endStaffSession = () => endSession("staff");

export async function getStaff(): Promise<StaffUser | null> {
  const email = await sessionEmail("staff");
  if (!email) return null;
  return (
    (db.prepare("SELECT email, name, role FROM staff WHERE email = ?").get(email) as
      | StaffUser
      | undefined) ?? null
  );
}

/** A one-time sign-in link token for a guest, valid for 15 minutes. */
export function createLoginToken(email: string): string {
  const token = newToken();
  db.prepare("INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)").run(
    sha(token),
    email,
    Date.now() + 15 * 60_000,
  );
  return token;
}

/** Returns the email for a valid token and burns it so it can't be reused. */
export function consumeLoginToken(token: string): string | null {
  const row = db
    .prepare("SELECT email FROM login_tokens WHERE token_hash = ? AND expires_at > ?")
    .get(sha(token), Date.now()) as { email: string } | undefined;
  db.prepare("DELETE FROM login_tokens WHERE token_hash = ? OR expires_at <= ?").run(
    sha(token),
    Date.now(),
  );
  return row?.email ?? null;
}

/** Anonymous browser id, so a guest's own hold never blocks their retry. */
export async function clientId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CLIENT)?.value;
  if (existing) return existing;
  const id = newToken();
  jar.set(CLIENT, id, cookieOptions(30));
  return id;
}

/** Stand-in mailer: stores the message. Swap for the real email provider. */
export function sendEmail(recipient: string, subject: string, body: string) {
  db.prepare("INSERT INTO outbox (recipient, subject, body, created_at) VALUES (?, ?, ?, ?)").run(
    recipient,
    subject,
    body,
    Date.now(),
  );
}

export const isDev = process.env.NODE_ENV !== "production";
