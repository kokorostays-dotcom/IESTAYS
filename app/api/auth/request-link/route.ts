import { sendGuestLink } from "@/lib/server/auth";
import { hasBooking, isEmail } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

/**
 * Emails a one-time sign-in link if the address has a booking. The response is
 * the same either way, so nobody can use it to check who has booked.
 */
export const POST = route(async (b, req) => {
  const email = need(isEmail(b.email) && b.email.trim().toLowerCase(), "Enter a valid email address.");
  const devLink = (await hasBooking(email))
    ? await sendGuestLink(email, new URL(req.url).origin)
    : null;
  return { ok: true, devLink };
});
