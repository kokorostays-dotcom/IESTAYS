import { staffSignIn } from "@/lib/server/auth";
import { route } from "@/lib/server/http";

export const POST = route(async (b) => {
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  await staffSignIn(email, password);
});
