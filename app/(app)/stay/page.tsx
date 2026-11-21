"use client";

import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import StayGate from "@/components/StayGate";
import { Card, Logo, Photo } from "@/components/ui";
import { CHECK_IN_TIME, CHECK_OUT_TIME, heroOf, photosOf } from "@/lib/data";
import { diffDays, fmtLong, yen } from "@/lib/dates";
import { useToday } from "@/lib/store";

function Tile({
  href,
  icon,
  label,
  note,
  done,
}: {
  href: string;
  icon: IconName;
  label: string;
  note: string;
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-3xl bg-card p-4 shadow-soft transition active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <Icon name={icon} size={26} />
        {done ? (
          <span className="grid size-6 place-items-center rounded-full bg-brand text-paper">
            <Icon name="check" size={14} />
          </span>
        ) : (
          <Icon name="chevronRight" size={18} className="text-muted" />
        )}
      </div>
      <div className="mt-6">
        <p className="text-[15px] font-medium">{label}</p>
        <p className="mt-0.5 text-[12px] text-muted">{note}</p>
      </div>
    </Link>
  );
}

export default function Stay() {
  const today = useToday();

  return (
    <main className="pb-28">
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo />
        <Link href="/stays" className="text-[13px] underline underline-offset-4">
          All stays
        </Link>
      </header>

      <StayGate>
        {({ booking, property: p, state }) => {
          const checkedIn = !!state.checkins[booking.ref];
          const days = today ? diffDays(today, booking.checkIn) : null;
          const countdown =
            days === null
              ? ""
              : days > 1
                ? `${days} days to go`
                : days === 1
                  ? "Tomorrow"
                  : days === 0
                    ? "Arriving today"
                    : today! < booking.checkOut
                      ? "You're staying now"
                      : "Stay complete";
          const photos = photosOf(p);
          return (
            <div className="rise px-5">
              <h1 className="pt-7 font-serif text-[34px]">Your stay</h1>

              <Card className="mt-4 !p-3">
                <div className="flex gap-4">
                  <Photo src={heroOf(p)} alt="" className="size-24 shrink-0 rounded-2xl" />
                  <div className="min-w-0 py-1">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px]">
                      {countdown || "Confirmed"}
                    </span>
                    <h2 className="mt-2 font-serif text-[22px] leading-tight">{p.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                      <Icon name="pin" size={14} />
                      {p.area}, {p.prefecture}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-[13px]">
                  {[
                    ["Check-in", fmtLong(booking.checkIn), `from ${CHECK_IN_TIME}`],
                    ["Check-out", fmtLong(booking.checkOut), `by ${CHECK_OUT_TIME}`],
                  ].map(([k, d, t]) => (
                    <div key={k} className="bg-paper p-3">
                      <dt className="text-[11px] text-muted">{k}</dt>
                      <dd className="mt-0.5 font-medium">{d}</dd>
                      <dd className="text-muted">{t}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Tile
                  href="/stay/check-in"
                  icon="door"
                  label="Check in"
                  note={checkedIn ? "Completed" : "Takes 2 minutes"}
                  done={checkedIn}
                />
                <Tile
                  href="/stay/access"
                  icon="key"
                  label="Access"
                  note={checkedIn ? "Door code and directions" : "Check in first"}
                />
                <Tile href="/stay/messages" icon="chat" label="Message us" note="We reply quickly" />
                <Tile href="/stay/guide" icon="book" label="House guide" note="Wi-Fi, rules, checkout" />
              </div>

              <Link href="/stay/guide" className="relative mt-4 block overflow-hidden rounded-3xl">
                <Photo
                  src={photos[1] ?? photos[0]}
                  alt=""
                  className="aspect-[16/10] w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <p className="font-serif text-[24px] leading-tight">
                    Welcome to
                    <br />
                    {p.name}
                  </p>
                  <span className="grid size-10 place-items-center rounded-full border border-white/70">
                    <Icon name="arrowRight" size={18} />
                  </span>
                </div>
              </Link>

              <Card className="mt-4 space-y-2.5 text-[14px]">
                <h3 className="font-serif text-[20px]">Booking</h3>
                {[
                  ["Reference", booking.ref],
                  ["Lead guest", booking.name],
                  ["Guests", String(booking.adults + booking.children)],
                  ["Paid", yen(booking.total)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-muted">{k}</span>
                    <span className="text-right">{v}</span>
                  </div>
                ))}
              </Card>
            </div>
          );
        }}
      </StayGate>
    </main>
  );
}
