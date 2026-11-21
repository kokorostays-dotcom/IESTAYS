// Browser-side calls to the reservation API. The server owns availability,
// holds, prices and payment; these functions only ask.

import type { Night } from "./inventory";
import { ApiError, post, type Booking } from "./store";

export { ApiError };
export { channelRuns, doorCode, hash, quote } from "./inventory";
export type { Night, Quote } from "./inventory";

export type Hold = { id: string; expiresAt: number };

export async function fetchAvailability(
  slug: string,
  from: string,
  days: number,
): Promise<Record<string, Night>> {
  const res = await fetch(
    `/api/availability?slug=${encodeURIComponent(slug)}&from=${from}&days=${days}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new ApiError("availability", "We couldn't load availability.");
  return res.json();
}

/** Re-check inventory and reserve the dates while the guest pays. */
export const createHold = (slug: string, checkIn: string, checkOut: string) =>
  post<Hold>("/api/holds", { slug, checkIn, checkOut });

/**
 * Only the method and last four digits leave the browser. With a real payment
 * provider this carries the provider's one-time token instead.
 */
export type Payment = { method: "apple_pay" } | { method: "card"; last4: string };

/** Take payment and confirm. Success is returned only when both succeed. */
export const confirmBooking = (input: {
  holdId: string;
  name: string;
  email: string;
  adults: number;
  children: number;
  payment: Payment;
}) => post<Booking>("/api/bookings", input);
