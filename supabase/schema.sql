-- Kokoro database. Paste this whole file into the Supabase SQL Editor and
-- press Run. It is safe to run again: nothing that already exists is changed.
--
-- Sign-in accounts live in Supabase Auth (Authentication > Users). The staff
-- table below decides who may open the back office.

create table if not exists staff (
  email text primary key check (email = lower(email)),
  name text not null,
  role text not null check (role in ('Administrator', 'Property staff'))
);

create table if not exists bookings (
  ref text primary key,
  slug text not null,
  check_in text not null check (check_in ~ '^\d{4}-\d{2}-\d{2}$'),
  check_out text not null check (check_out ~ '^\d{4}-\d{2}-\d{2}$'),
  adults integer not null,
  children integer not null,
  total integer not null,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index if not exists bookings_slug on bookings (slug, check_in);
create index if not exists bookings_email on bookings (email);

-- Dates reserved for ten minutes while a guest pays.
create table if not exists holds (
  id text primary key,
  client text not null,
  slug text not null,
  check_in text not null,
  check_out text not null,
  expires_at timestamptz not null
);
create index if not exists holds_slug on holds (slug);

-- Nights staff have closed by hand.
create table if not exists blocks (
  slug text not null,
  date text not null,
  primary key (slug, date)
);

create table if not exists checkins (
  ref text primary key references bookings (ref) on delete cascade,
  name text not null,
  phone text not null,
  country text not null,
  id_added boolean not null,
  arrival text not null,
  completed_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  ref text not null references bookings (ref) on delete cascade,
  sender text not null check (sender in ('guest', 'kokoro')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_ref on messages (ref);

-- Booking emails waiting for a real email provider to send them.
create table if not exists outbox (
  id bigint generated always as identity primary key,
  recipient text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Row-level security with no policies: nothing here can be read or written
-- with the public key. Only the app's server, over DATABASE_URL, has access.
alter table staff enable row level security;
alter table bookings enable row level security;
alter table holds enable row level security;
alter table blocks enable row level security;
alter table checkins enable row level security;
alter table messages enable row level security;
alter table outbox enable row level security;
