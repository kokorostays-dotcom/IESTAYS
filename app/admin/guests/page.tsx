"use client";

import { useState } from "react";
import { Empty, PageHeader, Panel, td, th } from "@/components/admin/ui";
import { useAdminData, type AdminBooking } from "@/lib/admin";
import { fmtShort, yen } from "@/lib/dates";

export default function Guests() {
  const { today, bookings } = useAdminData();
  const [query, setQuery] = useState("");
  if (!today) return null;

  const byEmail = new Map<string, AdminBooking[]>();
  for (const b of bookings) {
    if (b.cancelled) continue;
    byEmail.set(b.email, [...(byEmail.get(b.email) ?? []), b]);
  }
  const q = query.trim().toLowerCase();
  const guests = [...byEmail.values()]
    .map((stays) => ({
      name: stays[0].name,
      email: stays[0].email,
      stays: stays.length,
      nights: stays.reduce((n, b) => n + b.nights, 0),
      spend: stays.reduce((n, b) => n + b.total, 0),
      next: stays.find((b) => b.checkIn >= today),
      last: stays.filter((b) => b.checkOut <= today).at(-1),
      channels: [...new Set(stays.map((b) => b.channel))].join(", "),
    }))
    .filter((g) => !q || `${g.name} ${g.email}`.toLowerCase().includes(q))
    .sort((a, b) => b.spend - a.spend);

  return (
    <>
      <PageHeader title="Guests" sub={`${guests.length} guests`} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or email"
        aria-label="Search guests"
        className="mb-4 h-10 w-72 max-w-full rounded-xl border border-line bg-paper px-4 text-[14px] placeholder:text-faint"
      />
      <Panel className="overflow-x-auto">
        {guests.length === 0 ? (
          <Empty>No guests match that search.</Empty>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {["Guest", "Email", "Stays", "Nights", "Total spend", "Next stay", "Last stay", "Booked via"].map(
                  (h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {guests.slice(0, 100).map((g) => (
                <tr key={g.email}>
                  <td className={`${td} font-medium`}>{g.name}</td>
                  <td className={`${td} text-muted`}>{g.email}</td>
                  <td className={`${td} tabular-nums`}>{g.stays}</td>
                  <td className={`${td} tabular-nums`}>{g.nights}</td>
                  <td className={`${td} font-medium tabular-nums`}>{yen(g.spend)}</td>
                  <td className={td}>
                    {g.next ? `${fmtShort(g.next.checkIn)} · ${g.next.property.name}` : "—"}
                  </td>
                  <td className={td}>{g.last ? fmtShort(g.last.checkOut) : "—"}</td>
                  <td className={`${td} text-muted`}>{g.channels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
