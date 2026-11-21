import "server-only";
import { getStaff, type StaffUser } from "./auth";
import { HttpError } from "./bookings";

/** Every back-office endpoint starts here: no staff session, no data. */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaff();
  if (!staff) throw new HttpError(401, "unauthorised", "Sign in to the back office first.");
  return staff;
}
