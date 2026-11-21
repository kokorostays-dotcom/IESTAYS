import { endStaffSession } from "@/lib/server/auth";
import { route } from "@/lib/server/http";

export const POST = route(async () => {
  await endStaffSession();
});
