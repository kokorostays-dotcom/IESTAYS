import { getGuestEmail } from "@/lib/server/auth";
import { addMessage, guestBooking, text } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

export const POST = route(async (b) => {
  const booking = await guestBooking(b.ref, await getGuestEmail());
  await addMessage(booking.ref, "guest", need(text(b.text, 2000), "Write a message first."));
});
