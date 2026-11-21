import { endGuestSession } from "@/lib/server/auth";
import { route } from "@/lib/server/http";

export const POST = route(async () => {
  await endGuestSession();
});
