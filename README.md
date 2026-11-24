# Kokoro booking platform

Guest website, mobile web app and staff back office for Kokoro Hospitality / IE Stays.
Built with Next.js 16, Tailwind CSS 4 and Supabase (Postgres database and sign-in).

## Set up Supabase

1. Create a project at supabase.com (Tokyo region is closest to the houses).
2. Open the SQL Editor, paste in `supabase/schema.sql` and press Run.
3. Copy `.env.example` to `.env.local` and fill in the four values. Never commit
   `.env.local`.
4. Under Authentication > URL Configuration, set the Site URL to the address the site
   runs on (`http://localhost:3000` in development) and add `http://localhost:3000/**`
   and the live domain's `/**` to the redirect URLs.
5. Before real guests use it, connect an email sender under Authentication > SMTP
   Settings. Supabase's built-in sender is for testing only.
6. So sign-in links work on any device, change the Magic Link email template
   (Authentication > Emails) to link to
   `{{ .SiteURL }}/api/auth/verify?token_hash={{ .TokenHash }}&type=email`.
   With the standard template the link only works in the browser that asked for it.

### The first administrator

1. Authentication > Users > Add user > Send invitation, with their email.
2. In the SQL Editor:
   ```sql
   insert into staff (email, name, role)
   values ('person@example.com', 'Their Name', 'Administrator');
   ```
3. They open the emailed link, choose a password and are signed in.

After that, administrators add and remove people on the Team page of the back
office. A person only gets in if their email is in the `staff` table; having a
Supabase account is not enough.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

- Guest site and app: http://localhost:3000
- Staff back office: http://localhost:3000/admin

In development, a guest's sign-in link is shown on screen instead of being emailed.

## What is real and what is a stand-in

Real: bookings, holds, double-booking protection, guest sign-in links and staff
accounts (Supabase Auth), staff invitations, online check-in, messages, date blocks.
Every table has row-level security with no public access; only the server reads
or writes them.

Stand-ins, each isolated behind one function so a provider can be plugged in:

| Area | Where | Today |
| --- | --- | --- |
| Channel inventory (Agoda, Trip.com, ...) | `lib/inventory.ts` | Generated sample reservations |
| Payment | `takePayment` in `lib/server/bookings.ts` | Nothing is charged |
| Booking emails (confirmation, cancellation) | `sendEmail` in `lib/server/auth.ts` | Written to the `outbox` table |
| Door codes | `doorCode` in `lib/inventory.ts` | Generated, not issued by a lock |

Prices, guest counts, amenities, fees, tax and house-guide text in `lib/data.ts` are
placeholders until Kokoro supplies the real figures. Photos and the hero film load
from kokoro.co and ie.house.

## Layout

- `app/` pages: home, `property/[slug]`, `(app)/` booking and stay screens, `admin/` back office, `api/` server routes
- `components/` shared UI; `components/admin/` back office UI
- `lib/` shared data and rules; `lib/server/` database, sign-in and booking logic
- `supabase/schema.sql` the database tables
