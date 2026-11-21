"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookingDrawer,
  ChannelTag,
  Empty,
  PageHeader,
  Panel,
  Stat,
  td,
  th,
} from "@/components/admin/ui";
import { houses, monthOf, monthStats, statusOf, useAdminData, type AdminBooking } from "@/lib/admin";
import { addDays, fmtLong, fmtShort, yen } from "@/lib/dates";

export default function Today() {
  const { today, bookings, staff } = useAdminData();
  const [open, setOpen] = useState<AdminBooking | null>(null);
  if (!today) return null;

  const live = bookings.filter((b) => !b.cancelled);
  const arrivals = live.filter((b) => b.checkIn === today);
  const departures = live.filter((b) => b.checkOut === today);
  const inHouse = live.filter((b) => statusOf(b, today) === "In house");
  const week = live.filter((b) => b.checkIn > today && b.checkIn <= addDays(today, 7));
  const waiting = week.filter((b) => !b.checkedInOnline);
  const recent = [...live].sort((a, b) => b.bookedOn.localeCompare(a.bookedOn)).slice(0, 6);
  const month = monthStats(bookings, monthOf(today));

  const list = (rows: AdminBooking[], empty: string, date: (b: AdminBooking) => string) =>
    rows.length === 0 ? (
      <Empty>{empty}</Empty>
    ) : (
      <ul className="divide-y divide-line border-t border-line">
        {rows.map((b) => (
          <li key={b.ref}>
            <button
              type="button"
              onClick={() => setOpen(b)}
              className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-card"
            >
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium">{b.name}</span>
                <span className="block truncate text-[13px] text-muted">
                  {b.property.name} · {b.guests} guests
                </span>
              </span>
              <span className="shrink-0 text-right text-[13px]">
                <span className="block">{date(b)}</span>
                <span className={b.checkedInOnline ? "text-muted" : "text-danger"}>
                  {b.checkedInOnline ? "Checked in online" : "Check-in not done"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <PageHeader
        title={`Good day, ${staff?.name.split(" ")[0] ?? ""}`}
        sub={fmtLong(today)}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Arriving today" value={String(arrivals.length)} />
        <Stat label="Departing today" value={String(departures.length)} />
        <Stat
          label="Houses occupied"
          value={`${inHouse.length} / ${houses.length}`}
          note="Tonight"
        />
        <Stat
          label="Check-ins outstanding"
          value={String(waiting.length)}
          note="Arrivals in the next 7 days"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Arrivals today">
          {list(arrivals, "No arrivals today.", () => "Today, from 15:00")}
        </Panel>
        <Panel title="Departures today">
          {list(departures, "No departures today.", () => "Today, by 11:00")}
        </Panel>
        <Panel title="Arriving in the next 7 days">
          {list(week, "Nothing in the next week.", (b) => fmtShort(b.checkIn))}
        </Panel>
        <Panel
          title="This month so far"
          right={
            <Link href="/admin/finance" className="text-[13px] underline underline-offset-4">
              Finance
            </Link>
          }
        >
          <dl className="grid grid-cols-2 gap-px border-t border-line bg-line">
            {[
              ["Gross revenue", yen(month.gross)],
              ["Net after commission", yen(month.net)],
              ["Occupancy", `${Math.round(month.occupancy * 100)}%`],
              ["Average nightly rate", yen(month.adr)],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper px-5 py-4">
                <dt className="text-[13px] text-muted">{k}</dt>
                <dd className="mt-1 text-[20px] font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel title="Latest bookings" className="mt-5 overflow-x-auto">
        <table className="w-full border-t border-line">
          <thead>
            <tr>
              {["Guest", "House", "Dates", "Channel", "Gross"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {recent.map((b) => (
              <tr key={b.ref} onClick={() => setOpen(b)} className="cursor-pointer hover:bg-card">
                <td className={`${td} font-medium`}>{b.name}</td>
                <td className={td}>{b.property.name}</td>
                <td className={td}>
                  {fmtShort(b.checkIn)} – {fmtShort(b.checkOut)}
                </td>
                <td className={td}>
                  <ChannelTag channel={b.channel} />
                </td>
                <td className={`${td} tabular-nums`}>{yen(b.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {open && <BookingDrawer b={open} today={today} onClose={() => setOpen(null)} />}
    </>
  );
}
