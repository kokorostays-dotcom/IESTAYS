import "server-only";
import { getStaff, type StaffUser } from "./auth";
import { HttpError } from "./errors";

/** Every back-office endpoint starts here: no staff session, no data. */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaff();
  if (!staff) throw new HttpError(401, "unauthorised", "Sign in to the back office first.");
  return staff;
}

/** For endpoints only administrators may use, such as managing the team. */
export async function requireAdmin(): Promise<StaffUser> {
  const staff = await requireStaff();
  if (staff.role !== "Administrator") {
    throw new HttpError(403, "forbidden", "Only administrators can do that.");
  }
  return staff;
}
