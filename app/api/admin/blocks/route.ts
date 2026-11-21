import { isDate } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { getProperty } from "@/lib/data";
import { need, route } from "@/lib/server/http";
import { requireStaff } from "@/lib/server/staff";

/** Toggle a staff block on one night of one house. */
export const POST = route(async (b) => {
  await requireStaff();
  const slug = need(typeof b.slug === "string" && getProperty(b.slug)?.bookable && b.slug, "Unknown house.");
  const date = need(isDate(b.date) && b.date, "Choose a date.");
  const removed = db.prepare("DELETE FROM blocks WHERE slug = ? AND date = ?").run(slug, date);
  if (!removed.changes) db.prepare("INSERT INTO blocks (slug, date) VALUES (?, ?)").run(slug, date);
});
