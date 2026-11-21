"use client";

import { useState } from "react";
import {
  BookingDrawer,
  ChannelTag,
  Empty,
  PageHeader,
  Panel,
  StatusBadge,
  td,
  th,
} from "@/components/admin/ui";
import {
  CHANNELS,
  downloadCSV,
  houses,
  statusOf,
  toCSV,
  useAdminData,
  type AdminBooking,
  type Status,
} from "@/lib/admin";
import { fmtShort, yen } from "@/lib/dates";

const statuses: (Status | "All")[] = ["All", "Upcoming", "In house", "Completed", "Cancelled"];

export default function Bookings() {
  const { today, bookings } = useAdminData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "All">("Upcoming");
  const [channel, setChannel] = useState("All");
  const [house, setHouse] = useState("All");
  const [open, setOpen] = useState<AdminBooking | null>(null);
  if (!today) return null;

  const q = query.trim().toLowerCase();
  const rows = bookings.filter(
    (b) =>
      (status === "All" || statusOf(b, today) === status) &&
      (channel === "All" || b.channel === channel) &&
      (house === "All" || b.slug === house) &&
      (!q || `${b.ref} ${b.name} ${b.email}`.toLowerCase().includes(q)),
  );
  // Past stays read best newest-first; everything else soonest-first.
  const sorted = status === "Completed" ? [...rows].reverse() : rows;
  const select = "h-10 rounded-xl border border-line bg-paper px-3 text-[14px]";

  return (
    <>
      <PageHeader
        title="Bookings"
        sub={`${rows.length} of ${bookings.length} reservations`}
        right={
          <button
            type="button"
            onClick={() => downloadCSV(`kokoro-bookings-${today}.csv`, toCSV(sorted, today))}
            className="h-10 rounded-xl border border-line bg-paper px-4 text-[14px] font-medium hover:bg-card"
          >
            Export CSV
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 pb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guest, email or reference"
          aria-label="Search bookings"
          className="h-10 w-72 max-w-full rounded-xl border border-line bg-paper px-4 text-[14px] placeholder:text-faint"
        />
        <select
          aria-label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className={select}
        >
          <option value="All">All channels</option>
          {CHANNELS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="House"
          value={house}
          onChange={(e) => setHouse(e.target.value)}
          className={select}
        >
          <option value="All">All houses</option>
          {houses.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-4">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
            className={`h-9 shrink-0 rounded-full border px-4 text-[13px] ${
              status === s ? "border-brand bg-brand text-white" : "border-line bg-paper"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        {sorted.length === 0 ? (
          <Empty>No bookings match these filters.</Empty>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {["Reference", "Guest", "House", "Check-in", "Check-out", "Channel", "Status", "Gross", "Net"].map(
                  (h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {sorted.slice(0, 80).map((b) => (
                <tr key={b.ref} onClick={() => setOpen(b)} className="cursor-pointer hover:bg-card">
                  <td className={`${td} text-muted tabular-nums`}>{b.ref}</td>
                  <td className={`${td} font-medium`}>{b.name}</td>
                  <td className={td}>{b.property.name}</td>
                  <td className={td}>{fmtShort(b.checkIn)}</td>
                  <td className={td}>{fmtShort(b.checkOut)}</td>
                  <td className={td}>
                    <ChannelTag channel={b.channel} />
                  </td>
                  <td className={td}>
                    <StatusBadge status={statusOf(b, today)} />
                  </td>
                  <td className={`${td} tabular-nums`}>{yen(b.total)}</td>
                  <td className={`${td} font-medium tabular-nums`}>{yen(b.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {sorted.length > 80 && (
        <p className="pt-3 text-[13px] text-muted">
          Showing the first 80. Narrow the filters or export for the full list.
        </p>
      )}

      {open && <BookingDrawer b={open} today={today} onClose={() => setOpen(null)} />}
    </>
  );
}
