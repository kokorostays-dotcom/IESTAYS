import "server-only";
import { randomBytes } from "node:crypto";
import { getProperty } from "../data";
import { addDays, nightsBetween, todayISO } from "../dates";
import { priceFor, quote, soldElsewhere, type Night } from "../inventory";
import type { Booking, CheckIn, Message } from "../store";
import { db, transaction } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

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
  created_at: number;
  cancelled_at: number | null;
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
  createdAt: r.created_at,
});

/** Nights that are taken by a booking, a staff block or someone else's live hold. */
function takenNights(slug: string, from: string, to: string, client: string): Set<string> {
  const taken = new Set<string>();
  const spans = [
    ...(db
      .prepare(
        "SELECT check_in, check_out FROM bookings WHERE slug = ? AND cancelled_at IS NULL AND check_out > ? AND check_in < ?",
      )
      .all(slug, from, to) as { check_in: string; check_out: string }[]),
    ...(db
      .prepare(
        "SELECT check_in, check_out FROM holds WHERE slug = ? AND client != ? AND expires_at > ? AND check_out > ? AND check_in < ?",
      )
      .all(slug, client, Date.now(), from, to) as { check_in: string; check_out: string }[]),
  ];
  for (const s of spans) for (const d of nightsBetween(s.check_in, s.check_out)) taken.add(d);
  const blocks = db
    .prepare("SELECT date FROM blocks WHERE slug = ? AND date >= ? AND date < ?")
    .all(slug, from, to) as { date: string }[];
  for (const b of blocks) taken.add(b.date);
  return taken;
}

export function availability(
  slug: string,
  from: string,
  days: number,
  client: string,
): Record<string, Night> {
  const p = getProperty(slug);
  if (!p?.bookable) throw new HttpError(404, "not_found", "That house isn't open for booking.");
  const to = addDays(from, days);
  const taken = takenNights(slug, from, to, client);
  const out: Record<string, Night> = {};
  for (const date of nightsBetween(from, to)) {
    out[date] = {
      available: !taken.has(date) && !soldElsewhere(slug, date),
      price: priceFor(p, date),
    };
  }
  return out;
}

function assertBookable(slug: string, checkIn: string, checkOut: string, client: string) {
  const p = getProperty(slug);
  if (!p?.bookable) throw new HttpError(404, "not_found", "That house isn't open for booking.");
  const nights = nightsBetween(checkIn, checkOut);
  if (checkIn < todayISO() || nights.length < p.minStay || nights.length > 60) {
    throw new HttpError(400, "invalid_dates", "Those dates can't be booked.");
  }
  const taken = takenNights(slug, checkIn, checkOut, client);
  if (nights.some((d) => taken.has(d) || soldElsewhere(slug, d))) {
    throw new HttpError(409, "unavailable", "Those dates were just booked by someone else.");
  }
  return p;
}

/** Re-check inventory and reserve the dates for 10 minutes while the guest pays. */
export function createHold(slug: string, checkIn: string, checkOut: string, client: string) {
  return transaction(() => {
    db.prepare("DELETE FROM holds WHERE client = ? OR expires_at <= ?").run(client, Date.now());
    assertBookable(slug, checkIn, checkOut, client);
    const hold = { id: `hold_${randomBytes(9).toString("base64url")}`, expiresAt: Date.now() + 600_000 };
    db.prepare(
      "INSERT INTO holds (id, client, slug, check_in, check_out, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(hold.id, client, slug, checkIn, checkOut, hold.expiresAt);
    return hold;
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
}): Booking {
  return transaction(() => {
    const hold = db
      .prepare("SELECT slug, check_in, check_out, expires_at FROM holds WHERE id = ? AND client = ?")
      .get(input.holdId, input.client) as
      | { slug: string; check_in: string; check_out: string; expires_at: number }
      | undefined;
    if (!hold || hold.expires_at < Date.now()) {
      throw new HttpError(410, "hold_expired", "Your hold on these dates ran out.");
    }
    const p = assertBookable(hold.slug, hold.check_in, hold.check_out, input.client);
    const guests = input.adults + input.children;
    if (input.adults < 1 || input.children < 0 || guests > p.guests) {
      throw new HttpError(400, "invalid_guests", `This house sleeps up to ${p.guests}.`);
    }
    // The price is always worked out here, never taken from the browser.
    const q = quote(hold.slug, hold.check_in, hold.check_out, guests)!;
    takePayment(input.payment);

    const row: Row = {
      ref: `KKR-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`,
      slug: hold.slug,
      check_in: hold.check_in,
      check_out: hold.check_out,
      adults: input.adults,
      children: input.children,
      total: q.total,
      name: input.name,
      email: input.email.toLowerCase(),
      created_at: Date.now(),
      cancelled_at: null,
    };
    db.prepare(
      "INSERT INTO bookings (ref, slug, check_in, check_out, adults, children, total, name, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      row.ref, row.slug, row.check_in, row.check_out, row.adults, row.children, row.total,
      row.name, row.email, row.created_at,
    );
    db.prepare("DELETE FROM holds WHERE id = ?").run(input.holdId);
    return toBooking(row);
  });
}

/** Everything a signed-in guest, a staff member, or both may see. */
export function visibleState(guestEmail: string | null, isStaff: boolean) {
  const rows = (
    isStaff
      ? db.prepare("SELECT * FROM bookings ORDER BY check_in").all()
      : guestEmail
        ? db.prepare("SELECT * FROM bookings WHERE email = ? ORDER BY check_in").all(guestEmail)
        : []
  ) as Row[];
  const refs = new Set(rows.map((r) => r.ref));

  const checkins: Record<string, CheckIn> = {};
  for (const c of db.prepare("SELECT * FROM checkins").all() as {
    ref: string; name: string; phone: string; country: string; id_added: number;
    arrival: string; completed_at: number;
  }[]) {
    if (!refs.has(c.ref)) continue;
    checkins[c.ref] = {
      name: c.name, phone: c.phone, country: c.country, idAdded: !!c.id_added,
      arrival: c.arrival, completedAt: c.completed_at,
    };
  }

  const messages: Record<string, Message[]> = {};
  for (const m of db.prepare("SELECT * FROM messages ORDER BY id").all() as {
    id: number; ref: string; sender: "guest" | "kokoro"; body: string; created_at: number;
  }[]) {
    if (!refs.has(m.ref)) continue;
    (messages[m.ref] ??= []).push({ from: m.sender, text: m.body, at: m.id });
  }

  return {
    bookings: rows.map(toBooking),
    cancelled: rows.filter((r) => r.cancelled_at).map((r) => r.ref),
    checkins,
    messages,
    blocks: isStaff
      ? (db.prepare("SELECT slug, date FROM blocks").all() as { slug: string; date: string }[]).map(
          (b) => `${b.slug}:${b.date}`,
        )
      : [],
  };
}

/** The booking, if it exists, isn't cancelled and belongs to this guest. */
export function guestBooking(ref: unknown, email: string | null): Booking {
  const row =
    typeof ref === "string" && email
      ? (db
          .prepare("SELECT * FROM bookings WHERE ref = ? AND email = ? AND cancelled_at IS NULL")
          .get(ref, email) as Row | undefined)
      : undefined;
  if (!row) throw new HttpError(404, "not_found", "We couldn't find that booking.");
  return toBooking(row);
}

export function anyBooking(ref: unknown): Booking {
  const row =
    typeof ref === "string"
      ? (db.prepare("SELECT * FROM bookings WHERE ref = ?").get(ref) as Row | undefined)
      : undefined;
  if (!row) throw new HttpError(404, "not_found", "We couldn't find that booking.");
  return toBooking(row);
}

export function addMessage(ref: string, sender: "guest" | "kokoro", body: string) {
  db.prepare("INSERT INTO messages (ref, sender, body, created_at) VALUES (?, ?, ?, ?)").run(
    ref, sender, body, Date.now(),
  );
}
