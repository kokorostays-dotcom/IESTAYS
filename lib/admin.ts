"use client";

// Back office data. Channel reservations are derived from the same mock
// inventory the guest calendar uses, and direct bookings come from the guest
// app's store, so both sides always agree. Replace useAdminData with real
// PMS / payment queries when the backend exists.

import { useMemo } from "react";
import { channelRuns, hash, quote } from "./inventory";
import { properties, type Property } from "./data";
import { addDays, diffDays, iso, parse } from "./dates";
import { useAppState, useHydrated, useToday, type State } from "./store";

export const CHANNELS = ["Direct", "Agoda", "Trip.com", "Airbnb", "Booking.com"] as const;
export type Channel = (typeof CHANNELS)[number];

export const channelColor: Record<Channel, string> = {
  Direct: "#5a4332",
  Agoda: "#b4573b",
  "Trip.com": "#2f6f8f",
  Airbnb: "#b0567a",
  "Booking.com": "#3b5b92",
};

/** Placeholder commission rates until Kokoro's real channel contracts are known. */
export const COMMISSION: Record<Channel, number> = {
  Direct: 0,
  Agoda: 0.18,
  "Trip.com": 0.15,
  Airbnb: 0.15,
  "Booking.com": 0.15,
};

export const ADMIN_ONLY = ["/admin/finance", "/admin/team"];

export type AdminBooking = {
  ref: string;
  slug: string;
  property: Property;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  name: string;
  email: string;
  channel: Channel;
  total: number;
  tax: number;
  commission: number;
  net: number;
  bookedOn: string;
  cancelled: boolean;
  checkedInOnline: boolean;
};

export type Status = "Upcoming" | "In house" | "Completed" | "Cancelled";

const NAMES = [
  "Hannah Lim", "Marco Ricci", "Sofia Andersson", "Daniel Wong", "Priya Nair", "Lucas Meyer",
  "Emma Dubois", "Noah Kim", "Chloe Tan", "Oliver Hughes", "Mei Suzuki", "Arjun Mehta",
  "Isabella Costa", "Ethan Park", "Amelia Clarke", "Kenji Mori", "Lea Fischer", "Sam Ng",
  "Grace Chen", "Tomás Silva", "Yuna Choi", "Felix Braun", "Nora Jensen", "Wei Jie Goh",
];
const OTAS: Channel[] = ["Agoda", "Trip.com", "Airbnb", "Booking.com"];

function fromChannels(p: Property, today: string): AdminBooking[] {
  return channelRuns(p.slug, addDays(today, -150), addDays(today, 150)).map((run) => {
    const h = hash(`${p.slug}:${run.checkIn}`);
    const channel = OTAS[h % OTAS.length];
    const name = NAMES[(h >>> 3) % NAMES.length];
    const guests = 1 + ((h >>> 5) % Math.min(p.guests, 4));
    const q = quote(p.slug, run.checkIn, run.checkOut, guests)!;
    const commission = Math.round(q.total * COMMISSION[channel]);
    return {
      ref: `${channel.slice(0, 2).toUpperCase()}-${(h % 2176782336).toString(36).toUpperCase().padStart(6, "0")}`,
      slug: p.slug,
      property: p,
      checkIn: run.checkIn,
      checkOut: run.checkOut,
      nights: q.nights,
      guests,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
      channel,
      total: q.total,
      tax: q.tax,
      commission,
      net: q.total - commission,
      // Reservations already on the books were, by definition, made before today.
      bookedOn: ((d) => (d < today ? d : addDays(today, -(1 + (h % 20)))))(
        addDays(run.checkIn, -(7 + ((h >>> 7) % 60))),
      ),
      cancelled: false,
      checkedInOnline: run.checkIn <= today || h % 3 !== 0,
    };
  });
}

function fromDirect(state: State): AdminBooking[] {
  return state.bookings.flatMap((b) => {
    const property = properties.find((p) => p.slug === b.slug);
    if (!property) return [];
    const guests = b.adults + b.children;
    const q = quote(b.slug, b.checkIn, b.checkOut, guests);
    return [
      {
        ref: b.ref,
        slug: b.slug,
        property,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: diffDays(b.checkIn, b.checkOut),
        guests,
        name: b.name,
        email: b.email,
        channel: "Direct" as Channel,
        total: b.total,
        tax: q?.tax ?? 0,
        commission: 0,
        net: b.total,
        bookedOn: iso(new Date(b.createdAt)),
        cancelled: state.cancelled.includes(b.ref),
        checkedInOnline: !!state.checkins[b.ref],
      },
    ];
  });
}

export const houses = properties.filter((p) => p.bookable);

export function useAdminData() {
  const state = useAppState();
  const hydrated = useHydrated();
  const today = useToday();
  const bookings = useMemo(() => {
    if (!today) return [];
    return [...houses.flatMap((p) => fromChannels(p, today)), ...fromDirect(state)].sort((a, b) =>
      a.checkIn.localeCompare(b.checkIn),
    );
  }, [today, state]);
  return { hydrated, today, bookings, state, staff: state.staff };
}

export function statusOf(b: AdminBooking, today: string): Status {
  if (b.cancelled) return "Cancelled";
  if (b.checkOut <= today) return "Completed";
  if (b.checkIn <= today) return "In house";
  return "Upcoming";
}

/* ---------- Finance ---------- */

export const monthOf = (date: string) => date.slice(0, 7);

export function addMonths(month: string, n: number): string {
  const d = parse(`${month}-01`);
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))).slice(0, 7);
}

export function monthBounds(month: string): [string, string] {
  const start = `${month}-01`;
  return [start, `${addMonths(month, 1)}-01`];
}

export type MonthStats = {
  gross: number;
  commission: number;
  net: number;
  tax: number;
  nightsSold: number;
  nightsAvailable: number;
  occupancy: number;
  adr: number;
  arrivals: number;
  byChannel: Record<Channel, number>;
  byHouse: Record<string, { gross: number; nights: number }>;
};

/** Revenue is spread across the nights of each stay, so months split fairly. */
export function monthStats(bookings: AdminBooking[], month: string): MonthStats {
  const [start, end] = monthBounds(month);
  const days = diffDays(start, end);
  const stats: MonthStats = {
    gross: 0,
    commission: 0,
    net: 0,
    tax: 0,
    nightsSold: 0,
    nightsAvailable: houses.length * days,
    occupancy: 0,
    adr: 0,
    arrivals: 0,
    byChannel: { Direct: 0, Agoda: 0, "Trip.com": 0, Airbnb: 0, "Booking.com": 0 },
    byHouse: Object.fromEntries(houses.map((p) => [p.slug, { gross: 0, nights: 0 }])),
  };
  for (const b of bookings) {
    if (b.cancelled) continue;
    const from = b.checkIn > start ? b.checkIn : start;
    const to = b.checkOut < end ? b.checkOut : end;
    const overlap = diffDays(from, to);
    if (overlap <= 0) continue;
    const share = overlap / b.nights;
    stats.gross += b.total * share;
    stats.commission += b.commission * share;
    stats.net += b.net * share;
    stats.tax += b.tax * share;
    stats.nightsSold += overlap;
    stats.byChannel[b.channel] += b.total * share;
    stats.byHouse[b.slug].gross += b.total * share;
    stats.byHouse[b.slug].nights += overlap;
    if (b.checkIn >= start && b.checkIn < end) stats.arrivals++;
  }
  stats.occupancy = stats.nightsSold / stats.nightsAvailable;
  stats.adr = stats.nightsSold ? stats.gross / stats.nightsSold : 0;
  return stats;
}

export function toCSV(rows: AdminBooking[], today: string): string {
  const head = [
    "Reference", "Status", "House", "Guest", "Email", "Channel", "Check-in", "Check-out",
    "Nights", "Guests", "Gross JPY", "Commission JPY", "Net JPY", "Tax JPY", "Booked on",
  ];
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((b) =>
    [
      b.ref, statusOf(b, today), b.property.name, b.name, b.email, b.channel, b.checkIn,
      b.checkOut, b.nights, b.guests, b.total, b.commission, b.net, b.tax, b.bookedOn,
    ]
      .map(cell)
      .join(","),
  );
  return [head.map(cell).join(","), ...lines].join("\n");
}

export function downloadCSV(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
