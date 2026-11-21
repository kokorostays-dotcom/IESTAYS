import "server-only";
import { mkdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// SQLite keeps local development to a single file with no service to run.
// The SQL below is plain enough to move to Postgres for production.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS staff (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Administrator', 'Property staff')),
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('guest', 'staff')),
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  ref TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  total INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  cancelled_at INTEGER
);
CREATE INDEX IF NOT EXISTS bookings_slug ON bookings (slug, check_in);
CREATE INDEX IF NOT EXISTS bookings_email ON bookings (email);
CREATE TABLE IF NOT EXISTS holds (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  slug TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS blocks (
  slug TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (slug, date)
);
CREATE TABLE IF NOT EXISTS checkins (
  ref TEXT PRIMARY KEY REFERENCES bookings (ref),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  id_added INTEGER NOT NULL,
  arrival TEXT NOT NULL,
  completed_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL REFERENCES bookings (ref),
  sender TEXT NOT NULL CHECK (sender IN ('guest', 'kokoro')),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Demo staff, created once in an empty database. Replace before going live. */
const SEED_STAFF = [
  { email: "admin@kokoro.co", name: "Aiko Tanaka", role: "Administrator" },
  { email: "staff@kokoro.co", name: "Ren Sato", role: "Property staff" },
];
export const SEED_PASSWORD = process.env.KOKORO_SEED_PASSWORD ?? "kokoro-demo";

function open(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(process.env.KOKORO_DB ?? path.join(dir, "kokoro.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM staff").get() as { n: number };
  if (n === 0) {
    const insert = db.prepare(
      "INSERT INTO staff (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    );
    for (const s of SEED_STAFF) insert.run(s.email, s.name, s.role, hashPassword(SEED_PASSWORD));
  }
  return db;
}

// One connection per server process, surviving dev hot reloads.
const globalForDb = globalThis as unknown as { kokoroDb?: DatabaseSync };
export const db = (globalForDb.kokoroDb ??= open());

/** Run several statements atomically; any throw rolls everything back. */
export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
