import { clientId } from "@/lib/server/auth";
import { createHold, isDate } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

export const POST = route(async (b) =>
  createHold(
    need(typeof b.slug === "string" && b.slug, "Choose a house."),
    need(isDate(b.checkIn) && b.checkIn, "Choose a check-in date."),
    need(isDate(b.checkOut) && b.checkOut, "Choose a check-out date."),
    await clientId(),
  ),
);
