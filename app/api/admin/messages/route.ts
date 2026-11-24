import { addMessage, anyBooking, text } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";
import { requireStaff } from "@/lib/server/staff";

export const POST = route(async (b) => {
  await requireStaff();
  const message = need(text(b.text, 2000), "Write a message first.");
  await addMessage((await anyBooking(b.ref)).ref, "kokoro", message);
});
