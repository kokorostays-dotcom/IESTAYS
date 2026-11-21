import { getGuestEmail, getStaff, isDev } from "@/lib/server/auth";
import { visibleState } from "@/lib/server/bookings";
import { db, SEED_PASSWORD } from "@/lib/server/db";
import { route } from "@/lib/server/http";

/** What this browser may see: its guest's stays, plus everything if staff. */
export const GET = route(async () => {
  const [guestEmail, staff] = await Promise.all([getGuestEmail(), getStaff()]);
  return {
    sessionEmail: guestEmail,
    staff,
    team: staff ? db.prepare("SELECT email, name, role FROM staff ORDER BY role, name").all() : [],
    // Shown on the staff sign-in screen during development only.
    demoStaff: isDev
      ? {
          accounts: db.prepare("SELECT email, role FROM staff ORDER BY role").all(),
          password: SEED_PASSWORD,
        }
      : null,
    ...visibleState(guestEmail, !!staff),
  };
});
