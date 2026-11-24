import "server-only";

/** An error the API answers with as JSON, using this status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Thrown when the Supabase keys are missing from the environment. */
export const notConnected = (missing: string) =>
  new HttpError(
    503,
    "not_connected",
    `Supabase isn't connected yet: ${missing} is missing. See the README.`,
  );
