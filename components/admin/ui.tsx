"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "../Icon";
import { Photo } from "../ui";
import { doorCode } from "@/lib/api";
import { channelColor, statusOf, type AdminBooking, type Channel, type Status } from "@/lib/admin";
import { heroOf } from "@/lib/data";
import { fmtLong, yen } from "@/lib/dates";
import { cancelBooking } from "@/lib/store";

export function PageHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-paper ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-1 text-[12px] text-muted">{note}</p>}
    </div>
  );
}

const statusTone: Record<Status, string> = {
  Upcoming: "bg-[#eef3fb] text-[#2b4f85]",
  "In house": "bg-[#e9f4ec] text-[#256a3c]",
  Completed: "bg-[#f1f1f1] text-[#555]",
  Cancelled: "bg-[#fbecea] text-[#a4442f]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${statusTone[status]}`}>
      {status}
    </span>
  );
}

export function ChannelTag({ channel }: { channel: Channel }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="size-2.5 rounded-full" style={{ background: channelColor[channel] }} />
      {channel}
    </span>
  );
}

export const th = "px-5 py-2.5 text-left text-[12px] font-medium text-muted whitespace-nowrap";
export const td = "px-5 py-3 text-[14px] whitespace-nowrap";

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-[14px] text-muted">{children}</p>;
}

/** Slide-over with everything staff need about one reservation. */
export function BookingDrawer({
  b,
  today,
  onClose,
}: {
  b: AdminBooking;
  today: string;
  onClose: () => void;
}) {
  const status = statusOf(b, today);
  const rows = (items: [string, ReactNode][]) => (
    <dl className="space-y-2.5 text-[14px]">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-6">
          <dt className="text-muted">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
  const direct = b.channel === "Direct";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Booking ${b.ref}`}
        className="flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-paper shadow-[0_0_60px_rgb(0_0_0/0.25)]"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="text-[12px] text-muted">Booking</p>
            <p className="text-[18px] font-semibold tabular-nums">{b.ref}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full hover:bg-card"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-7 px-6 py-6">
          <div className="flex items-center gap-4">
            <Photo src={heroOf(b.property)} alt="" className="size-16 rounded-xl" />
            <div>
              <p className="text-[16px] font-semibold">{b.property.name}</p>
              <p className="text-[13px] text-muted">
                {b.property.area}, {b.property.prefecture}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="pb-3 text-[13px] font-semibold">Stay</h3>
            {rows([
              ["Check-in", fmtLong(b.checkIn)],
              ["Check-out", fmtLong(b.checkOut)],
              ["Nights", b.nights],
              ["Guests", b.guests],
              ["Booked on", fmtLong(b.bookedOn)],
            ])}
          </div>

          <div>
            <h3 className="pb-3 text-[13px] font-semibold">Guest</h3>
            {rows([
              ["Name", b.name],
              ["Email", <span key="e" className="[overflow-wrap:anywhere]">{b.email}</span>],
              ["Online check-in", b.checkedInOnline ? "Completed" : "Not yet"],
              ["Door code", status === "Cancelled" ? "Revoked" : doorCode(b.ref)],
            ])}
          </div>

          <div>
            <h3 className="pb-3 text-[13px] font-semibold">Payment</h3>
            {rows([
              ["Channel", <ChannelTag key="c" channel={b.channel} />],
              ["Gross", yen(b.total)],
              ["Channel commission", b.commission ? `− ${yen(b.commission)}` : "None"],
              ["Net to Kokoro", <span key="n" className="font-semibold">{yen(b.net)}</span>],
              ["Accommodation tax collected", yen(b.tax)],
              [
                "Status",
                status === "Cancelled"
                  ? "Refund due"
                  : direct
                    ? "Paid by card"
                    : b.checkOut <= today
                      ? "Paid out by channel"
                      : "Payout after check-out",
              ],
            ])}
          </div>

          <div className="space-y-3">
            {direct && status !== "Cancelled" && (
              <Link
                href="/admin/inbox"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-[14px] font-medium hover:bg-card"
              >
                <Icon name="chat" size={18} />
                Message guest
              </Link>
            )}
            {direct && status === "Upcoming" && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Cancel booking ${b.ref}? This frees the dates for sale.`)) {
                    cancelBooking(b.ref);
                    onClose();
                  }
                }}
                className="h-12 w-full rounded-xl border border-danger/40 text-[14px] font-medium text-danger hover:bg-danger/5"
              >
                Cancel booking
              </button>
            )}
            {!direct && (
              <p className="text-[13px] leading-relaxed text-muted">
                This reservation came from {b.channel}. Changes and cancellations are made in the
                channel, then sync here.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
