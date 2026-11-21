// All dates are plain "YYYY-MM-DD" strings. Maths is done in UTC so a
// guest's timezone can never shift a night.

const pad = (n: number) => String(n).padStart(2, "0");

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function iso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: string, n: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

export function dayNumber(date: string): number {
  return Math.round(parse(date).getTime() / 86400000);
}

export function diffDays(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

export function fmt(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
    parse(date),
  );
}

export const fmtShort = (d: string) => fmt(d, { day: "numeric", month: "short" });
export const fmtLong = (d: string) =>
  fmt(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function fmtRange(checkIn: string, checkOut: string): string {
  return `${fmtShort(checkIn)} – ${fmtShort(checkOut)}`;
}

export const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;
