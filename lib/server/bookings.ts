import "server-only";
import { randomBytes } from "node:crypto";
import { getProperty } from "../data";
import { addDays, nightsBetween, todayISO } from "../dates";
import { priceFor, quote, soldElsewhere, type Night } from "../inventory";
import type { Booking, CheckIn, Message, Staff } from "../store";
import { db, transaction, type Q } from "./db";
import { HttpError } from "./errors";

export { HttpError };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (v: unknown): v is string => typeof v === "string" && DATE.test(v);
export const isEmail = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const text = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;

type Row = {
  ref: string;
  slug: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total: number;
  name: string;
  email: string;
  created_at: Date;
  cancelled_at: Date | null;
};

const toBooking = (r: Row): Booking => ({
  ref: r.ref,
  slug: r.slug,
  checkIn: r.check_in,
  checkOut: r.check_out,
  adults: r.adults,
  children: r.children,
  total: r.total,
  name: r.name,
  email: r.email,
  createdAt: r.created_at.getTime(),
});

/** Nights that are taken by a booking, a staff block or someone else's live hold. */
async function takenNights(
  q: Q,
  slug: string,
  from: string,
  to: string,
  client: string,
): Promise<Set<string>> {
  const taken = new Set<string>();
  const spans = await q<{ check_in: string; check_out: string }[]>`
    select check_in, check_out from bookings
    where slug = ${slug} and cancelled_at is null and check_out > ${from} and check_in < ${to}
    union all
    select check_in, check_out from holds
    where slug = ${slug} and client <> ${client} and expires_at > now()
      and check_out > ${from} and check_in < ${to}`;
  for (const s of spans) for (const d of nightsBetween(s.check_in, s.check_out)) taken.add(d);
  const blocks = await q<{ date: string }[]>`
    select date from blocks where slug = ${slug} and date >= ${from} and date < ${to}`;
  for (const b of blocks) taken.add(b.date);
  return taken;
}

export async function availability(
  slug: string,
  from: string,
  days: number,
  client: string,
): Promise<Record<string, Night>> {
  const p = getProperty(slug);
  if (!p?.bookable) throw new HttpError(404, "not_found", "That house isn't open for booking.");
  const to = addDays(from, days);
  const taken = await takenNights(db(), slug, from, to, client);
  const out: Record<string, Night> = {};
  for (const date of nightsBetween(from, to)) {
    out[date] = {
      available: !taken.has(date) && !soldElsewhere(slug, date),
      price: priceFor(p, date),
    };
  }
  return out;
}

/**
 * Checks the dates inside a transaction. The lock makes two guests going for
 * the same house wait their turn, so the same night can never be sold twice.
 */
async function assertBookable(
  tx: Q,
  slug: string,
  checkIn: string,
  checkOut: string,
  client: string,
) {
  const p = getProperty(slug);
  if (!p?.bookable) throw new HttpError(404, "not_found", "That house isn't open for booking.");
  const nights = nightsBetween(checkIn, checkOut);
  if (checkIn < todayISO() || nights.length < p.minStay || nights.length > 60) {
    throw new HttpError(400, "invalid_dates", "Those dates can't be booked.");
  }
  await tx`select pg_advisory_xact_lock(hashtext(${slug}))`;
  const taken = await takenNights(tx, slug, checkIn, checkOut, client);
  if (nights.some((d) => taken.has(d) || soldElsewhere(slug, d))) {
    throw new HttpError(409, "unavailable", "Those dates were just booked by someone else.");
  }
  return p;
}

/** Re-check inventory and reserve the dates for 10 minutes while the guest pays. */
export function createHold(slug: string, checkIn: string, checkOut: string, client: string) {
  return transaction(async (tx) => {
    await tx`delete from holds where client = ${client} or expires_at <= now()`;
    await assertBookable(tx, slug, checkIn, checkOut, client);
    const id = `hold_${randomBytes(9).toString("base64url")}`;
    const [row] = await tx<{ expires_at: Date }[]>`
      insert into holds (id, client, slug, check_in, check_out, expires_at)
      values (${id}, ${client}, ${slug}, ${checkIn}, ${checkOut}, now() + interval '10 minutes')
      returning expires_at`;
    return { id, expiresAt: row.expires_at.getTime() };
  });
}

/**
 * Payment stand-in. The browser never sends a card number to this server: with
 * a real provider it sends the provider's token, and this function charges it.
 */
function takePayment(payment: { method: string; last4?: string }) {
  if (payment.method === "card" && payment.last4 === "0002") {
    throw new HttpError(402, "payment_failed", "Your card was declined. You have not been charged.");
  }
}

export function confirmBooking(input: {
  holdId: string;
  client: string;
  name: string;
  email: string;
  adults: number;
  children: number;
  payment: { method: string; last4?: string };
}): Promise<Booking> {
  return transaction(async (tx) => {
    const [hold] = await tx<{ slug: string; check_in: string; check_out: string }[]>`
      select slug, check_in, check_out from holds
      where id = ${input.holdId} and client = ${input.client} and expires_at > now()`;
    if (!hold) throw new HttpError(410, "hold_expired", "Your hold on these dates ran out.");
    const p = await assertBookable(tx, hold.slug, hold.check_in, hold.check_out, input.client);
    const guests = input.adults + input.children;
    if (
      !Number.isInteger(input.adults) ||
      !Number.isInteger(input.children) ||
      input.adults < 1 ||
      input.children < 0 ||
      guests > p.guests
    ) {
      throw new HttpError(400, "invalid_guests", `This house sleeps up to ${p.guests}.`);
    }
    // The price is always worked out here, never taken from the browser.
    const q = quote(hold.slug, hold.check_in, hold.check_out, guests)!;
    takePayment(input.payment);

    const ref = `KKR-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
    const [row] = await tx<Row[]>`
      insert into bookings (ref, slug, check_in, check_out, adults, children, total, name, email)
      values (${ref}, ${hold.slug}, ${hold.check_in}, ${hold.check_out}, ${input.adults},
        ${input.children}, ${q.total}, ${input.name}, ${input.email.toLowerCase()})
      returning *`;
    await tx`delete from holds where id = ${input.holdId}`;
    return toBooking(row);
  });
}

/** Everything a signed-in guest, a staff member, or both may see. */
export async function visibleState(guestEmail: string | null, isStaff: boolean) {
  const sql = db();
  const rows = isStaff
    ? await sql<Row[]>`select * from bookings order by check_in`
    : guestEmail
      ? await sql<Row[]>`select * from bookings where email = ${guestEmail} order by check_in`
      : [];
  const refs = rows.map((r) => r.ref);

  const checkins: Record<string, CheckIn> = {};
  const messages: Record<string, Message[]> = {};
  if (refs.length) {
    const [checkinRows, messageRows] = await Promise.all([
      sql<
        {
          ref: string; name: string; phone: string; country: string; id_added: boolean;
          arrival: string; completed_at: Date;
        }[]
      >`select * from checkins where ref = any(${refs})`,
      sql<{ id: string; ref: string; sender: "guest" | "kokoro"; body: string }[]>`
        select id, ref, sender, body from messages where ref = any(${refs}) order by id`,
    ]);
    for (const c of checkinRows) {
      checkins[c.ref] = {
        name: c.name, phone: c.phone, country: c.country, idAdded: c.id_added,
        arrival: c.arrival, completedAt: c.completed_at.getTime(),
      };
    }
    for (const m of messageRows) {
      (messages[m.ref] ??= []).push({ from: m.sender, text: m.body, at: Number(m.id) });
    }
  }

  const blocks = isStaff ? await sql<{ slug: string; date: string }[]>`select slug, date from blocks` : [];
  return {
    bookings: rows.map(toBooking),
    cancelled: rows.filter((r) => r.cancelled_at).map((r) => r.ref),
    checkins,
    messages,
    blocks: blocks.map((b) => `${b.slug}:${b.date}`),
  };
}

/** Whether any booking, on this site or a partner's, was made with this email. */
export async function hasBooking(email: string): Promise<boolean> {
  const rows = await db()`select 1 from bookings where email = ${email} limit 1`;
  return rows.length > 0;
}

/** The booking, if it exists, isn't cancelled and belongs to this guest. */
export async function guestBooking(ref: unknown, email: string | null): Promise<Booking> {
  const [row] =
    typeof ref === "string" && email
      ? await db()<Row[]>`
          select * from bookings where ref = ${ref} and email = ${email} and cancelled_at is null`
      : [];
  if (!row) throw new HttpError(404, "not_found", "We couldn't find that booking.");
  return toBooking(row);
}

export async function anyBooking(ref: unknown): Promise<Booking> {
  const [row] =
    typeof ref === "string" ? await db()<Row[]>`select * from bookings where ref = ${ref}` : [];
  if (!row) throw new HttpError(404, "not_found", "We couldn't find that booking.");
  return toBooking(row);
}

export async function addMessage(ref: string, sender: "guest" | "kokoro", body: string) {
  await db()`insert into messages (ref, sender, body) values (${ref}, ${sender}, ${body})`;
}

/* ---------- Staff list ---------- */

export const listStaff = () =>
  db()<Staff[]>`select email, name, role from staff order by role, name`;

export async function findStaff(email: string): Promise<Staff | null> {
  const [row] = await db()<Staff[]>`select email, name, role from staff where email = ${email}`;
  return row ?? null;
}
