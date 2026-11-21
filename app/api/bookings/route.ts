import { clientId, sendEmail, startGuestSession } from "@/lib/server/auth";
import { confirmBooking, isEmail, text } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

/** Take payment and confirm. The guest is signed in straight away, with no account step. */
export const POST = route(async (b) => {
  const payment = (b.payment ?? {}) as { method?: unknown; last4?: unknown };
  const booking = confirmBooking({
    holdId: need(typeof b.holdId === "string" && b.holdId, "Your hold on these dates ran out."),
    client: await clientId(),
    name: need(text(b.name, 120), "Enter the lead guest's name."),
    email: need(isEmail(b.email) && b.email.trim(), "Enter a valid email address."),
    adults: Number(b.adults),
    children: Number(b.children),
    payment: {
      method: payment.method === "card" ? "card" : "apple_pay",
      last4: typeof payment.last4 === "string" ? payment.last4.slice(-4) : undefined,
    },
  });
  sendEmail(
    booking.email,
    `Your stay is confirmed (${booking.ref})`,
    `Booking ${booking.ref}: ${booking.checkIn} to ${booking.checkOut}.`,
  );
  await startGuestSession(booking.email);
  return booking;
});
