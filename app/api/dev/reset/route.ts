import { isDev } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { route } from "@/lib/server/http";

/** Wipes bookings and guest data for demos. Never available in production. */
export const POST = route(() => {
  if (!isDev) throw new HttpError(404, "not_found", "Not found.");
  db.exec(
    "DELETE FROM messages; DELETE FROM checkins; DELETE FROM bookings; DELETE FROM holds; DELETE FROM blocks; DELETE FROM login_tokens; DELETE FROM outbox; DELETE FROM sessions WHERE kind = 'guest';",
  );
});
