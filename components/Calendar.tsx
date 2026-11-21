"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAvailability, type Night } from "@/lib/api";
import { addDays, diffDays, fmt, iso, parse } from "@/lib/dates";

const MONTHS = 12;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  slug: string;
  today: string;
  minStay: number;
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /** Tailwind class for where the weekday row sticks, e.g. inside a scroll box. */
  stickyTop?: string;
};

function monthStarts(today: string): string[] {
  const d = parse(today);
  return Array.from({ length: MONTHS }, (_, i) =>
    iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1))),
  );
}

function daysIn(monthStart: string): (string | null)[] {
  const d = parse(monthStart);
  const count = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (d.getUTCDay() + 6) % 7; // Monday first
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => addDays(monthStart, i)),
  ];
}

export default function Calendar({
  slug,
  today,
  minStay,
  checkIn,
  checkOut,
  onChange,
  stickyTop = "top-[64px]",
}: Props) {
  const [nights, setNights] = useState<Record<string, Night> | null>(null);
  const months = useMemo(() => monthStarts(today), [today]);

  useEffect(() => {
    let live = true;
    fetchAvailability(slug, today, MONTHS * 31 + 31).then((n) => live && setNights(n));
    return () => {
      live = false;
    };
  }, [slug, today]);

  const choosingOut = !!checkIn && !checkOut;

  // The latest possible check-out: the first sold night after check-in.
  const lastOut = useMemo(() => {
    if (!nights || !checkIn) return null;
    let d = checkIn;
    while (nights[d]?.available) d = addDays(d, 1);
    return d;
  }, [nights, checkIn]);

  if (!nights) {
    return (
      <div className="space-y-6 px-4" aria-busy="true" aria-label="Loading availability">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="mb-4 h-6 w-36 animate-pulse rounded-full bg-brand-soft" />
            <div className="h-72 animate-pulse rounded-3xl bg-brand-soft/60" />
          </div>
        ))}
      </div>
    );
  }

  function state(d: string) {
    const free = d >= today && !!nights![d]?.available;
    if (choosingOut && checkIn && d > checkIn) {
      const ok = lastOut !== null && d <= lastOut && diffDays(checkIn, d) >= minStay;
      return { selectable: ok, struck: !free && d !== lastOut };
    }
    return { selectable: free, struck: !free && d >= today };
  }

  function pick(d: string) {
    if (choosingOut && checkIn) {
      if (d === checkIn) return onChange(null, null);
      if (d > checkIn) return onChange(checkIn, d);
    }
    onChange(d, null);
  }

  return (
    <div className="px-4">
      <div className={`sticky ${stickyTop} z-10 -mx-4 grid grid-cols-7 border-b border-line bg-paper/95 px-4 py-2 text-center text-[11px] text-muted backdrop-blur`}>
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      {months.map((m) => (
        <section key={m} className="pt-6">
          <h3 className="mb-3 font-serif text-[20px]">
            {fmt(m, { month: "long", year: "numeric" })}
          </h3>
          <div className="grid grid-cols-7 gap-y-1">
            {daysIn(m).map((d, i) => {
              if (!d) return <span key={i} />;
              const { selectable, struck } = state(d);
              const isIn = d === checkIn;
              const isOut = d === checkOut;
              const between = !!checkIn && !!checkOut && d > checkIn && d < checkOut;
              const end = isIn || isOut;
              return (
                <div
                  key={d}
                  className={`relative ${between ? "bg-brand-soft" : ""} ${
                    isIn && checkOut ? "rounded-l-full bg-brand-soft" : ""
                  } ${isOut ? "rounded-r-full bg-brand-soft" : ""}`}
                >
                  <button
                    type="button"
                    disabled={!selectable}
                    onClick={() => pick(d)}
                    aria-pressed={end}
                    aria-label={`${fmt(d, { weekday: "long", day: "numeric", month: "long" })}${
                      selectable ? "" : ", unavailable"
                    }`}
                    className={`flex aspect-square w-full flex-col items-center justify-center rounded-full text-[15px] transition ${
                      end ? "bg-brand font-medium text-paper" : ""
                    } ${!selectable && !end ? "text-faint" : ""} ${
                      struck && !end ? "line-through" : ""
                    }`}
                  >
                    {Number(d.slice(8))}
                    {selectable && !choosingOut && !end && !between && (
                      <span className="text-[9px] leading-none text-muted">
                        {Math.round(nights[d].price / 1000)}k
                      </span>
                    )}
                  </button>
                  {d === today && !end && (
                    <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-clay" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
