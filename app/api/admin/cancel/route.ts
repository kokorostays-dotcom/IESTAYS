import { sendEmail } from "@/lib/server/auth";
import { anyBooking } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { route } from "@/lib/server/http";
import { requireStaff } from "@/lib/server/staff";

export const POST = route(async (b) => {
  await requireStaff();
  const booking = anyBooking(b.ref);
  const done = db
    .prepare("UPDATE bookings SET cancelled_at = ? WHERE ref = ? AND cancelled_at IS NULL")
    .run(Date.now(), booking.ref);
  if (done.changes) {
    sendEmail(booking.email, `Your booking ${booking.ref} was cancelled`, "A refund is on its way.");
  }
});
