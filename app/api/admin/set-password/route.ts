import { setStaffPassword } from "@/lib/server/auth";
import { need, route } from "@/lib/server/http";

/** Called from the page an invitation or password-reset email links to. */
export const POST = route(async (b) => {
  const token = need(typeof b.token === "string" && b.token, "This link has expired. Ask for a new one.");
  const password = need(
    typeof b.password === "string" && b.password.length >= 10 && b.password.length <= 200 && b.password,
    "Choose a password of at least 10 characters.",
  );
  await setStaffPassword(token, password);
});
