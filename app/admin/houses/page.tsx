"use client";

import Link from "next/link";
import { PageHeader, Panel, td, th } from "@/components/admin/ui";
import { Photo } from "@/components/ui";
import { useAdminData } from "@/lib/admin";
import { heroOf, properties } from "@/lib/data";
import { addDays, diffDays, yen } from "@/lib/dates";

export default function Houses() {
  const { today, bookings } = useAdminData();
  if (!today) return null;
  const end = addDays(today, 30);

  const occupancy = (slug: string) => {
    const nights = bookings
      .filter((b) => b.slug === slug && !b.cancelled && b.checkOut > today && b.checkIn < end)
      .reduce(
        (n, b) =>
          n + diffDays(b.checkIn > today ? b.checkIn : today, b.checkOut < end ? b.checkOut : end),
        0,
      );
    return Math.round((nights / 30) * 100);
  };

  return (
    <>
      <PageHeader
        title="Houses"
        sub={`${properties.filter((p) => p.bookable).length} open for booking · ${
          properties.filter((p) => !p.bookable).length
        } in the pipeline`}
      />
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {["House", "Location", "Status", "Base rate", "Min. stay", "Sleeps", "Next 30 days", ""].map(
                (h, i) => (
                  <th key={i} className={th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {properties.map((p) => (
              <tr key={p.slug}>
                <td className={td}>
                  <span className="flex items-center gap-3">
                    <Photo src={heroOf(p)} alt="" className="size-11 rounded-lg" />
                    <span className="font-medium">{p.name}</span>
                  </span>
                </td>
                <td className={td}>
                  {p.area}, {p.prefecture}
                </td>
                <td className={td}>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      p.bookable ? "bg-[#e9f4ec] text-[#256a3c]" : "bg-[#f1f1f1] text-[#555]"
                    }`}
                  >
                    {p.bookable ? "Bookable" : p.status}
                  </span>
                </td>
                <td className={`${td} tabular-nums`}>{yen(p.baseRate)}</td>
                <td className={`${td} tabular-nums`}>{p.minStay} nights</td>
                <td className={`${td} tabular-nums`}>{p.guests}</td>
                <td className={`${td} tabular-nums`}>
                  {p.bookable ? `${occupancy(p.slug)}% booked` : "—"}
                </td>
                <td className={td}>
                  <Link href={`/property/${p.slug}`} className="underline underline-offset-4">
                    View listing
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <p className="pt-3 text-[13px] text-muted">
        Rates, photos and house guides are read-only here until the content backend is connected.
      </p>
    </>
  );
}
