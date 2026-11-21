// Pure pricing and channel-inventory rules, shared by the server and the UI.
//
// soldElsewhere / channelRuns stand in for the PMS or channel manager feed
// (Agoda, Trip.com and others). When the real PMS is connected, the server
// replaces these two functions with its data; nothing else needs to change.

import { getProperty, type Property } from "./data";
import { addDays, dayNumber, nightsBetween, parse } from "./dates";

export type Night = { available: boolean; price: number };

export type Quote = {
  nights: number;
  nightly: { date: string; price: number }[];
  subtotal: number;
  cleaningFee: number;
  tax: number;
  total: number;
};

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Nights already sold on another channel (deterministic stand-in). */
export function soldElsewhere(slug: string, date: string): boolean {
  const n = dayNumber(date);
  const week = Math.floor(n / 7);
  for (const w of [week - 1, week]) {
    const r = hash(`${slug}:${w}`) % 100;
    if (r >= 45) continue;
    const start = w * 7 + (r % 5);
    const length = 2 + (r % 3);
    if (n >= start && n < start + length) return true;
  }
  return false;
}

export type ChannelRun = { slug: string; checkIn: string; checkOut: string; seed: number };

/** The same sold nights as soldElsewhere, listed as reservations. */
export function channelRuns(slug: string, from: string, to: string): ChannelRun[] {
  const runs: { start: number; end: number; seed: number }[] = [];
  const last = Math.floor(dayNumber(to) / 7);
  for (let w = Math.floor(dayNumber(from) / 7) - 1; w <= last; w++) {
    const seed = hash(`${slug}:${w}`);
    const r = seed % 100;
    if (r >= 45) continue;
    const start = w * 7 + (r % 5);
    runs.push({ start, end: start + 2 + (r % 3), seed });
  }
  const day = (n: number) => addDays("1970-01-01", n);
  return runs
    .map((run, i) => ({ ...run, end: Math.min(run.end, runs[i + 1]?.start ?? run.end) }))
    .filter((run) => run.end > run.start)
    .map((run) => ({ slug, checkIn: day(run.start), checkOut: day(run.end), seed: run.seed }));
}

export function priceFor(p: Property, date: string): number {
  const d = parse(date);
  const dow = d.getUTCDay();
  const md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  let rate = p.baseRate;
  if (dow === 5 || dow === 6) rate *= 1.15;
  const peak =
    (md >= 320 && md <= 410) || (md >= 1110 && md <= 1205) || md >= 1228 || md <= 103;
  if (peak) rate *= 1.25;
  return Math.round(rate / 500) * 500;
}

export function quote(
  slug: string,
  checkIn: string,
  checkOut: string,
  guests: number,
): Quote | null {
  const p = getProperty(slug);
  if (!p) return null;
  const nightly = nightsBetween(checkIn, checkOut).map((date) => ({
    date,
    price: priceFor(p, date),
  }));
  const subtotal = nightly.reduce((sum, n) => sum + n.price, 0);
  // Placeholder: flat accommodation tax per guest per night.
  const tax = 500 * guests * nightly.length;
  return {
    nights: nightly.length,
    nightly,
    subtotal,
    cleaningFee: p.cleaningFee,
    tax,
    total: subtotal + p.cleaningFee + tax,
  };
}

/** Door code released by the lock provider (stand-in). */
export const doorCode = (ref: string) => String(100000 + (hash(`door:${ref}`) % 900000));
