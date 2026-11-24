import { getGuestEmail, getStaff } from "@/lib/server/auth";
import { listStaff, visibleState } from "@/lib/server/bookings";
import { route } from "@/lib/server/http";

/** What this browser may see: its guest's stays, plus everything if staff. */
export const GET = route(async () => {
  const [guestEmail, staff] = await Promise.all([getGuestEmail(), getStaff()]);
  const [team, visible] = await Promise.all([
    staff ? listStaff() : [],
    visibleState(guestEmail, !!staff),
  ]);
  return { sessionEmail: guestEmail, staff, team, ...visible };
});
