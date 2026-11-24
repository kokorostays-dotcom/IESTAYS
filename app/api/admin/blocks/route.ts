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
  const sql = db();
  const removed = await sql`delete from blocks where slug = ${slug} and date = ${date}`;
  if (!removed.count) {
    await sql`insert into blocks (slug, date) values (${slug}, ${date}) on conflict do nothing`;
  }
});
