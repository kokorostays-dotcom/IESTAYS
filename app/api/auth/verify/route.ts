import { exchangeGuestCode, verifyGuestToken } from "@/lib/server/auth";

/**
 * Where a guest's sign-in link lands. Supabase's standard email sends a `code`
 * (it works in the browser that asked for it); the email template in the
 * README sends a `token_hash`, which works on any device.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  let ok = false;
  try {
    if (hash) ok = await verifyGuestToken(hash, url.searchParams.get("type") ?? "email");
    else if (code) ok = await exchangeGuestCode(code);
  } catch (e) {
    console.error(e);
  }
  return Response.redirect(new URL(ok ? "/stays" : "/login?expired=1", url), 303);
}
