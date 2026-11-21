import { getGuestEmail } from "@/lib/server/auth";
import { guestBooking, text } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { need, route } from "@/lib/server/http";

export const POST = route(async (b) => {
  const booking = guestBooking(b.ref, await getGuestEmail());
  db.prepare(
    `INSERT INTO checkins (ref, name, phone, country, id_added, arrival, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (ref) DO UPDATE SET name = excluded.name, phone = excluded.phone,
       country = excluded.country, id_added = excluded.id_added, arrival = excluded.arrival,
       completed_at = excluded.completed_at`,
  ).run(
    booking.ref,
    need(text(b.name, 120), "Enter your full name."),
    need(text(b.phone, 40), "Enter a phone number."),
    need(text(b.country, 80), "Enter your country of residence."),
    need(b.idAdded === true, "Add your passport photo.") ? 1 : 0,
    need(text(b.arrival, 20), "Choose an arrival time."),
    Date.now(),
  );
});
