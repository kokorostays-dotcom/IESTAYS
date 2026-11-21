import { addMessage, anyBooking, text } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";
import { requireStaff } from "@/lib/server/staff";

export const POST = route(async (b) => {
  await requireStaff();
  addMessage(anyBooking(b.ref).ref, "kokoro", need(text(b.text, 2000), "Write a message first."));
});
