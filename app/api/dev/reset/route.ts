import { isDev } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { route } from "@/lib/server/http";

/** Wipes bookings and guest data for demos. Never available in production. */
export const POST = route(async () => {
  if (!isDev) throw new HttpError(404, "not_found", "Not found.");
  await db()`truncate messages, checkins, bookings, holds, blocks, outbox`;
});
