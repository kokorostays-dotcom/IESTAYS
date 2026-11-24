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
  return (globalForDb.kokoroSql ??= postgres(url, {
    // Supabase's transaction pooler doesn't keep prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  }));
}

/** Run several statements atomically; any throw rolls everything back. */
export const transaction = <T>(fn: (tx: postgres.TransactionSql) => Promise<T>) =>
  db().begin(fn) as Promise<T>;
