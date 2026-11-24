import "server-only";
import { connection } from "next/server";
import { HttpError } from "./errors";

type Body = Record<string, unknown>;

/** Wraps a route handler: parses JSON, and turns HttpError into a JSON error response. */
export function route(fn: (body: Body, req: Request) => Promise<unknown> | unknown) {
  return async (req: Request) => {
    // Every endpoint here depends on the live request, so none is prerendered.
    await connection();
    try {
      let body: Body = {};
      if (req.method !== "GET") {
        const parsed: unknown = await req.json().catch(() => null);
        if (!parsed || typeof parsed !== "object") {
          throw new HttpError(400, "bad_request", "The request was not valid.");
        }
        body = parsed as Body;
      }
      const result = await fn(body, req);
      return result instanceof Response ? result : Response.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) {
        return Response.json({ error: e.code, message: e.message }, { status: e.status });
      }
      console.error(e);
      // A short code such as CONNECT_TIMEOUT helps diagnose without exposing details.
      const code = (e as { code?: unknown })?.code;
      return Response.json(
        {
          error: "server_error",
          message: "Something went wrong. Please try again.",
          ...(typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code) ? { code } : {}),
        },
        { status: 500 },
      );
    }
  };
}

export function need<T>(value: T | null | undefined | false, message: string): T {
  if (!value) throw new HttpError(400, "bad_request", message);
  return value;
}
