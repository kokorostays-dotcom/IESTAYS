"use client";

import { useState } from "react";
import { ChannelTag, PageHeader, Panel, Stat, td, th } from "@/components/admin/ui";
import {
  addMonths,
  CHANNELS,
  channelColor,
  downloadCSV,
  houses,
  monthBounds,
  monthOf,
  monthStats,
  toCSV,
  useAdminData,
} from "@/lib/admin";
import { diffDays, fmt, yen } from "@/lib/dates";

const label = (month: string, long = true) =>
  fmt(`${month}-01`, long ? { month: "long", year: "numeric" } : { month: "short" });

export default function Finance() {
  const { today, bookings } = useAdminData();
  const [shift, setShift] = useState(0);
  if (!today) return null;

  const month = addMonths(monthOf(today), shift);
  const s = monthStats(bookings, month);
  const prev = monthStats(bookings, addMonths(month, -1));
  const [start, end] = monthBounds(month);
  const days = diffDays(start, end);
  const inMonth = bookings.filter((b) => !b.cancelled && b.checkOut > start && b.checkIn < end);

  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(month, i - 5);
    return { m, gross: monthStats(bookings, m).gross };
  });
  const peak = Math.max(...trend.map((t) => t.gross), 1);
  const delta = prev.gross ? Math.round(((s.gross - prev.gross) / prev.gross) * 100) : null;
  const btn = "h-10 rounded-xl border border-line bg-paper px-4 text-[14px] font-medium hover:bg-card disabled:opacity-40";

  return (
    <>
      <PageHeader
        title="Finance"
        sub={`${label(month)}${month > monthOf(today) ? " · forecast from bookings on the books" : ""}`}
        right={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => setShift(shift - 1)} disabled={shift <= -4}>
              Previous
            </button>
            <button type="button" className={btn} onClick={() => setShift(shift + 1)} disabled={shift >= 4}>
              Next
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => downloadCSV(`kokoro-finance-${month}.csv`, toCSV(inMonth, today))}
            >
              Export CSV
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Gross revenue"
          value={yen(s.gross)}
          note={delta === null ? undefined : `${delta >= 0 ? "+" : ""}${delta}% vs ${label(addMonths(month, -1), false)}`}
        />
        <Stat label="Channel commission" value={yen(s.commission)} note={`${s.gross ? Math.round((s.commission / s.gross) * 100) : 0}% of gross`} />
        <Stat label="Net revenue" value={yen(s.net)} note="After commission, before costs" />
        <Stat label="Accommodation tax collected" value={yen(s.tax)} note="Held for remittance" />
        <Stat label="Occupancy" value={`${Math.round(s.occupancy * 100)}%`} note={`${s.nightsSold} of ${s.nightsAvailable} nights`} />
        <Stat label="Average nightly rate" value={yen(s.adr)} note="Gross per night sold" />
        <Stat label="Revenue per available night" value={yen(s.gross / s.nightsAvailable)} />
        <Stat label="Arrivals" value={String(s.arrivals)} note="Stays starting this month" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Gross revenue, last 6 months">
          <div className="flex h-56 items-end gap-3 px-5 pt-2 pb-5" role="img" aria-label="Bar chart of monthly gross revenue">
            {trend.map((t) => (
              <div key={t.m} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] text-muted tabular-nums">
                  {(t.gross / 1_000_000).toFixed(1)}M
                </span>
                <div
                  className={`w-full rounded-t-lg ${t.m === month ? "bg-brand" : "bg-brand-soft"}`}
                  style={{ height: `${Math.max(2, (t.gross / peak) * 100)}%` }}
                />
                <span className="text-[12px] text-muted">{label(t.m, false)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue by channel">
          <ul className="space-y-4 px-5 pt-1 pb-5">
            {CHANNELS.map((c) => {
              const share = s.gross ? s.byChannel[c] / s.gross : 0;
              return (
                <li key={c}>
                  <div className="flex justify-between text-[14px]">
                    <ChannelTag channel={c} />
                    <span className="tabular-nums">
                      {yen(s.byChannel[c])}
                      <span className="text-muted"> · {Math.round(share * 100)}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-card">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${share * 100}%`, background: channelColor[c] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="By house" className="mt-5 overflow-x-auto">
        <table className="w-full border-t border-line">
          <thead>
            <tr>
              {["House", "Nights sold", "Occupancy", "Average nightly rate", "Gross"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {houses.map((p) => {
              const h = s.byHouse[p.slug];
              return (
                <tr key={p.slug}>
                  <td className={`${td} font-medium`}>{p.name}</td>
                  <td className={`${td} tabular-nums`}>{h.nights}</td>
                  <td className={`${td} tabular-nums`}>{Math.round((h.nights / days) * 100)}%</td>
                  <td className={`${td} tabular-nums`}>{yen(h.nights ? h.gross / h.nights : 0)}</td>
                  <td className={`${td} font-medium tabular-nums`}>{yen(h.gross)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <p className="pt-3 text-[13px] text-muted">
        Revenue is spread across the nights of each stay. Commission rates are placeholders until
        Kokoro&rsquo;s channel contracts are entered.
      </p>
    </>
  );
}
