import { createLoginToken, isDev, sendEmail } from "@/lib/server/auth";
import { isEmail } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { need, route } from "@/lib/server/http";

/**
 * Emails a one-time sign-in link if the address has a booking. The response is
 * the same either way, so nobody can use it to check who has booked.
 */
export const POST = route((b, req) => {
  const email = need(isEmail(b.email) && b.email.trim().toLowerCase(), "Enter a valid email address.");
  const known = db.prepare("SELECT 1 FROM bookings WHERE email = ? LIMIT 1").get(email);
  let devLink: string | null = null;
  if (known) {
    const link = `${new URL(req.url).origin}/api/auth/verify?token=${createLoginToken(email)}`;
    sendEmail(email, "Your Kokoro sign-in link", `Sign in: ${link}`);
    // No email provider is connected yet, so development shows the link on screen.
    if (isDev) devLink = link;
  }
  return { ok: true, devLink };
});
