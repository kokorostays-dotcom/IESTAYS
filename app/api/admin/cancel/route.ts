import { sendEmail } from "@/lib/server/auth";
import { anyBooking } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { route } from "@/lib/server/http";
import { requireStaff } from "@/lib/server/staff";

export const POST = route(async (b) => {
  await requireStaff();
  const booking = await anyBooking(b.ref);
  const done = await db()`
    update bookings set cancelled_at = now() where ref = ${booking.ref} and cancelled_at is null`;
  if (done.count) {
    await sendEmail(booking.email, `Your booking ${booking.ref} was cancelled`, "A refund is on its way.");
  }
});
