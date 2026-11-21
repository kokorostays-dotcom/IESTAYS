"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Calendar from "./Calendar";
import Icon from "./Icon";
import { Button } from "./ui";
import { quote } from "@/lib/api";
import { SUPPORT_EMAIL, type Property } from "@/lib/data";
import { fmtShort, yen } from "@/lib/dates";
import { useToday } from "@/lib/store";

/** Desktop listing sidebar: pick dates and guests, see the total, reserve. */
export default function BookingCard({ p }: { p: Property }) {
  const router = useRouter();
  const today = useToday();
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [open, setOpen] = useState(false);

  if (!p.bookable) {
    return (
      <div className="sticky top-8 rounded-3xl border border-line bg-paper p-6 shadow-soft">
        <p className="text-[13px] text-muted">Status</p>
        <p className="text-[26px] font-medium">{p.status}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          This house is not open for booking yet. Tell us you&rsquo;re interested and we&rsquo;ll
          let you know when it is.
        </p>
        <Button
          variant="secondary"
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(p.name)}`}
          className="mt-5"
        >
          Enquire
        </Button>
      </div>
    );
  }

  const q = checkIn && checkOut ? quote(p.slug, checkIn, checkOut, guests) : null;
  const cell = "flex flex-col items-start px-4 py-3 text-left";
  const label = "text-[10px] font-medium tracking-[0.12em] uppercase";
  const step = "grid size-8 place-items-center rounded-full border border-line disabled:opacity-35";

  return (
    <div id="book" className="sticky top-8 rounded-3xl border border-line bg-paper p-6 shadow-soft">
      <p aria-live="polite">
        {q ? (
          <>
            <span className="text-[26px] font-medium">{yen(q.total)}</span>
            <span className="text-[15px] text-muted"> for {q.nights} nights</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-medium">{yen(p.baseRate)}</span>
            <span className="text-[15px] text-muted"> / night</span>
          </>
        )}
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-faint">
        <div className="grid grid-cols-2 divide-x divide-faint">
          <button
            type="button"
            className={cell}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={label}>Check-in</span>
            <span className={`text-[15px] ${checkIn ? "" : "text-muted"}`}>
              {checkIn ? fmtShort(checkIn) : "Add date"}
            </span>
          </button>
          <button
            type="button"
            className={cell}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={label}>Checkout</span>
            <span className={`text-[15px] ${checkOut ? "" : "text-muted"}`}>
              {checkOut ? fmtShort(checkOut) : "Add date"}
            </span>
          </button>
        </div>

        {open && today && (
          <div className="border-t border-faint">
            <div className="h-[340px] overflow-y-auto pb-4">
              <Calendar
                slug={p.slug}
                today={today}
                minStay={p.minStay}
                checkIn={checkIn}
                checkOut={checkOut}
                stickyTop="top-0"
                onChange={(a, b) => {
                  setCheckIn(a);
                  setCheckOut(b);
                  if (a && b) setOpen(false);
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[13px]">
              <span className="text-muted">
                {checkIn && !checkOut
                  ? "Now choose check-out"
                  : `${p.minStay}-night minimum`}
              </span>
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                }}
              >
                Clear dates
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-faint px-4 py-3">
          <div>
            <p className={label}>Guests</p>
            <p className="text-[15px]" aria-live="polite">
              {guests} {guests === 1 ? "guest" : "guests"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Fewer guests"
              disabled={guests <= 1}
              onClick={() => setGuests(guests - 1)}
              className={step}
            >
              <Icon name="minus" size={14} />
            </button>
            <button
              type="button"
              aria-label="More guests"
              disabled={guests >= p.guests}
              onClick={() => setGuests(guests + 1)}
              className={step}
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>
      </div>

      <Button
        className="mt-4"
        onClick={() => {
          if (!q) return setOpen(true);
          router.push(`/book/${p.slug}?in=${checkIn}&out=${checkOut}&adults=${guests}`);
        }}
      >
        {q ? "Reserve" : "Check availability"}
      </Button>

      {q ? (
        <>
          <p className="mt-3 text-center text-[13px] text-muted">You won&rsquo;t be charged yet</p>
          <dl className="mt-5 space-y-2.5 text-[14px]">
            {[
              [`${q.nights} nights`, q.subtotal],
              ["Cleaning fee", q.cleaningFee],
              ["Accommodation tax", q.tax],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted underline decoration-line underline-offset-4">{k}</dt>
                <dd className="tabular-nums">{yen(v as number)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-3 text-[16px] font-medium">
              <dt>Total (JPY)</dt>
              <dd className="tabular-nums">{yen(q.total)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-center text-[13px] text-muted">
          No account needed · free cancellation up to 14 days before
        </p>
      )}
    </div>
  );
}
