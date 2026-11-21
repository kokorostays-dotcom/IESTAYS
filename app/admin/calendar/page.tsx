"use client";

import { useState } from "react";
import { BookingDrawer, PageHeader, Panel } from "@/components/admin/ui";
import {
  CHANNELS,
  channelColor,
  houses,
  useAdminData,
  type AdminBooking,
} from "@/lib/admin";
import { addDays, diffDays, fmt, parse } from "@/lib/dates";
import { toggleBlock } from "@/lib/store";

const DAYS = 28;
const CELL = 44;

export default function CalendarPage() {
  const { today, bookings, state } = useAdminData();
  const [offset, setOffset] = useState(-3);
  const [open, setOpen] = useState<AdminBooking | null>(null);
  if (!today) return null;

  const start = addDays(today, offset);
  const end = addDays(start, DAYS);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
  const btn = "h-10 rounded-xl border border-line bg-paper px-4 text-[14px] font-medium hover:bg-card";

  return (
    <>
      <PageHeader
        title="Calendar"
        sub={`${fmt(start, { day: "numeric", month: "short" })} – ${fmt(addDays(end, -1), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`}
        right={
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={() => setOffset(offset - 14)}>
              Earlier
            </button>
            <button type="button" className={btn} onClick={() => setOffset(-3)}>
              Today
            </button>
            <button type="button" className={btn} onClick={() => setOffset(offset + 14)}>
              Later
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-x-5 gap-y-2 pb-4 text-[13px]">
        {CHANNELS.map((c) => (
          <span key={c} className="flex items-center gap-2">
            <span className="size-3 rounded" style={{ background: channelColor[c] }} />
            {c}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="size-3 rounded bg-[repeating-linear-gradient(45deg,#cfcfcf_0_3px,#f1f1f1_3px_6px)]" />
          Blocked by staff
        </span>
      </div>

      <Panel className="overflow-x-auto">
        <div style={{ width: 200 + DAYS * CELL }}>
          <div className="flex border-b border-line">
            <div className="sticky left-0 z-10 w-[200px] shrink-0 bg-paper" />
            {days.map((d) => {
              const dow = parse(d).getUTCDay();
              return (
                <div
                  key={d}
                  style={{ width: CELL }}
                  className={`shrink-0 py-2 text-center text-[11px] ${
                    d === today ? "font-semibold text-brand" : "text-muted"
                  } ${dow === 0 || dow === 6 ? "bg-card" : ""}`}
                >
                  <div>{fmt(d, { weekday: "narrow" })}</div>
                  <div className="text-[14px] text-ink">{Number(d.slice(8))}</div>
                </div>
              );
            })}
          </div>

          {houses.map((p) => {
            const rows = bookings.filter(
              (b) => b.slug === p.slug && !b.cancelled && b.checkOut > start && b.checkIn < end,
            );
            return (
              <div key={p.slug} className="relative flex border-b border-line last:border-0">
                <div className="sticky left-0 z-10 flex w-[200px] shrink-0 items-center bg-paper px-4 text-[13px] font-medium">
                  <span className="truncate">{p.name}</span>
                </div>
                {days.map((d) => {
                  const key = `${p.slug}:${d}`;
                  const blocked = state.blocks.includes(key);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-label={`${blocked ? "Unblock" : "Block"} ${p.name} on ${d}`}
                      aria-pressed={blocked}
                      onClick={() => toggleBlock(key)}
                      style={{ width: CELL }}
                      className={`h-14 shrink-0 border-l border-line/70 hover:bg-card ${
                        blocked
                          ? "bg-[repeating-linear-gradient(45deg,#cfcfcf_0_3px,#f1f1f1_3px_6px)]"
                          : d === today
                            ? "bg-brand-soft/60"
                            : ""
                      }`}
                    />
                  );
                })}
                {rows.map((b) => {
                  const from = Math.max(0, diffDays(start, b.checkIn));
                  const to = Math.min(DAYS, diffDays(start, b.checkOut));
                  // Bars run from the afternoon of check-in to the morning of check-out.
                  const left = 200 + from * CELL + (b.checkIn >= start ? CELL / 2 : 0);
                  const right = 200 + to * CELL + (b.checkOut <= end ? CELL / 2 : 0);
                  return (
                    <button
                      key={b.ref}
                      type="button"
                      onClick={() => setOpen(b)}
                      title={`${b.name} · ${b.channel}`}
                      style={{
                        left: left + 2,
                        width: Math.min(right, 200 + DAYS * CELL) - left - 4,
                        background: channelColor[b.channel],
                      }}
                      className="absolute top-2.5 h-9 truncate rounded-lg px-2.5 text-left text-[12px] font-medium text-white hover:brightness-110"
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Panel>
      <p className="pt-3 text-[13px] text-muted">
        Click an empty night to block or unblock it for sale. Blocks apply to the guest site
        straight away. Click a reservation to open it.
      </p>

      {open && <BookingDrawer b={open} today={today} onClose={() => setOpen(null)} />}
    </>
  );
}
