import { consumeLoginToken, startGuestSession } from "@/lib/server/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = consumeLoginToken(url.searchParams.get("token") ?? "");
  if (!email) return Response.redirect(new URL("/login?expired=1", url), 303);
  await startGuestSession(email);
  return Response.redirect(new URL("/stays", url), 303);
}
