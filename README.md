# Kokoro booking platform

Guest website, mobile web app and staff back office for Kokoro Hospitality / IE Stays.
Built with Next.js 16, Tailwind CSS 4 and SQLite.

## Run it

Requires Node.js 22.5 or newer (the database uses Node's built-in SQLite).

```bash
npm install
npm run dev
```

- Guest site and app: http://localhost:3000
- Staff back office: http://localhost:3000/admin

The database is created at `data/kokoro.db` on first run, with two starter staff
accounts. In development the sign-in screen shows them. Set `KOKORO_SEED_PASSWORD`
before the first run to choose their password, and change it before going live.

## What is real and what is a stand-in

Real: bookings, holds, double-booking protection, guest sign-in links, staff accounts
(hashed passwords, server sessions), online check-in, messages, date blocks.

Stand-ins, each isolated behind one function so a provider can be plugged in:

| Area | Where | Today |
| --- | --- | --- |
| Channel inventory (Agoda, Trip.com, ...) | `lib/inventory.ts` | Generated sample reservations |
| Payment | `takePayment` in `lib/server/bookings.ts` | Nothing is charged |
| Email | `sendEmail` in `lib/server/auth.ts` | Written to the `outbox` table |
| Door codes | `doorCode` in `lib/inventory.ts` | Generated, not issued by a lock |

Prices, guest counts, amenities, fees, tax and house-guide text in `lib/data.ts` are
placeholders until Kokoro supplies the real figures. Photos and the hero film load
from kokoro.co and ie.house.

## Layout

- `app/` pages: home, `property/[slug]`, `(app)/` booking and stay screens, `admin/` back office, `api/` server routes
- `components/` shared UI; `components/admin/` back office UI
- `lib/` shared data and rules; `lib/server/` database, sign-in and booking logic
