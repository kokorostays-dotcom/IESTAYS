import { startStaffSession } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/bookings";
import { db, verifyPassword } from "@/lib/server/db";
import { route } from "@/lib/server/http";

export const POST = route(async (b) => {
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const row = db.prepare("SELECT password_hash FROM staff WHERE email = ?").get(email) as
    | { password_hash: string }
    | undefined;
  // Same message for an unknown email and a wrong password.
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new HttpError(401, "bad_credentials", "That email and password don't match a staff account.");
  }
  await startStaffSession(email);
});
