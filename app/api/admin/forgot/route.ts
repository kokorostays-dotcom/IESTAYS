import { sendStaffReset } from "@/lib/server/auth";
import { findStaff, isEmail } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

/**
 * Emails a password-reset link to a staff member. The response is the same
 * whether or not the address is on the team.
 */
export const POST = route(async (b, req) => {
  const email = need(isEmail(b.email) && b.email.trim().toLowerCase(), "Enter your work email first.");
  if (await findStaff(email)) await sendStaffReset(email, new URL(req.url).origin);
});
