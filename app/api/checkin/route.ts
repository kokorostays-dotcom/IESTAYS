import { getGuestEmail } from "@/lib/server/auth";
import { guestBooking, text } from "@/lib/server/bookings";
import { db } from "@/lib/server/db";
import { need, route } from "@/lib/server/http";

export const POST = route(async (b) => {
  const booking = await guestBooking(b.ref, await getGuestEmail());
  const c = {
    ref: booking.ref,
    name: need(text(b.name, 120), "Enter your full name."),
    phone: need(text(b.phone, 40), "Enter a phone number."),
    country: need(text(b.country, 80), "Enter your country of residence."),
    id_added: need(b.idAdded === true, "Add your passport photo."),
    arrival: need(text(b.arrival, 20), "Choose an arrival time."),
  };
  await db()`
    insert into checkins (ref, name, phone, country, id_added, arrival)
    values (${c.ref}, ${c.name}, ${c.phone}, ${c.country}, ${c.id_added}, ${c.arrival})
    on conflict (ref) do update set name = excluded.name, phone = excluded.phone,
      country = excluded.country, id_added = excluded.id_added, arrival = excluded.arrival,
      completed_at = now()`;
});
