import "server-only";
import postgres from "postgres";
import { notConnected } from "./errors";

// The app talks to Supabase's Postgres directly over DATABASE_URL, so bookings
// and holds can use real transactions. Tables are created by supabase/schema.sql.

export type Sql = postgres.Sql;
/** Either the pool or an open transaction. */
export type Q = postgres.Sql | postgres.TransactionSql;

// One pool per server process, surviving dev hot reloads.
const globalForDb = globalThis as unknown as { kokoroSql?: Sql };

export function db(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw notConnected("DATABASE_URL");
  if (/pooler\.supabase\.com:5432\b/.test(url)) {
    console.warn(
      "DATABASE_URL uses Supabase's session pooler (port 5432). Use the transaction pooler (port 6543): the session pooler runs out of connections on Vercel.",
    );
  }
  return (globalForDb.kokoroSql ??= postgres(url, {
    // Supabase's transaction pooler doesn't keep prepared statements.
    prepare: false,
    // Vercel runs many short-lived copies of the server; each keeps one
    // connection and lets it go quickly, so the database never runs out.
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: process.env.VERCEL ? 5 : 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
    // Fail with an error instead of hanging if the database is unreachable.
    queue_timeout: 15,
    query_timeout: 20,
    onnotice: () => {},
  }));
}

/** Run several statements atomically; any throw rolls everything back. */
export const transaction = <T>(fn: (tx: postgres.TransactionSql) => Promise<T>) =>
  db().begin(fn) as Promise<T>;
