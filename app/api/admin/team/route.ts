import { sendStaffInvite } from "@/lib/server/auth";
import { HttpError, isEmail, text } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { need, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/staff";

const ROLES = ["Administrator", "Property staff"];

/**
 * Administrators add or remove back-office access by email. Adding someone
 * emails them a link to choose their own password.
 */
export const POST = route(async (b, req) => {
  const me = await requireAdmin();
  const email = need(isEmail(b.email) && b.email.trim().toLowerCase(), "Enter a valid email address.");
  const sql = db();

  if (b.remove === true) {
    if (email === me.email) {
      throw new HttpError(400, "self", "You can't remove your own access.");
    }
    await sql`delete from staff where email = ${email}`;
    return;
  }

  const name = need(text(b.name, 120), "Enter their name.");
  const role = need(typeof b.role === "string" && ROLES.includes(b.role) && b.role, "Choose a role.");
  if (email === me.email && role !== me.role) {
    throw new HttpError(400, "self", "You can't change your own role.");
  }
  const [existing] = await sql`select 1 from staff where email = ${email}`;
  await sql`
    insert into staff (email, name, role) values (${email}, ${name}, ${role})
    on conflict (email) do update set name = excluded.name, role = excluded.role`;
  // Someone already on the team keeps their password; only new people are emailed.
  if (!existing) await sendStaffInvite(email, new URL(req.url).origin);
});
