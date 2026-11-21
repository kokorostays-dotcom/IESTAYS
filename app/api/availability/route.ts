import { clientId } from "@/lib/server/auth";
import { availability, isDate } from "@/lib/server/bookings";
import { need, route } from "@/lib/server/http";

export const GET = route(async (_body, req) => {
  const q = new URL(req.url).searchParams;
  const slug = need(q.get("slug"), "Choose a house.");
  const from = need(isDate(q.get("from")) && q.get("from"), "Choose a start date.");
  const days = Math.min(420, Math.max(1, Number(q.get("days")) || 31));
  return availability(slug, from, days, await clientId());
});
