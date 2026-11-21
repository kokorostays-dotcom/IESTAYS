"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import SignIn from "@/components/SignIn";
import { Button, Card, Empty, Photo } from "@/components/ui";
import { getProperty, heroOf } from "@/lib/data";
import { fmtRange } from "@/lib/dates";
import { setActive, useAppState, useHydrated, useToday } from "@/lib/store";

export default function Stays() {
  const router = useRouter();
  const hydrated = useHydrated();
  const today = useToday();
  const { sessionEmail, bookings } = useAppState();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  if (!hydrated) return <main className="pb-28" />;
  if (!sessionEmail) {
    return (
      <main className="pb-28">
        <SignIn />
      </main>
    );
  }

  const mine = bookings
    .filter((b) => b.email === sessionEmail)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const list = mine.filter((b) => (tab === "upcoming") === b.checkOut >= (today ?? ""));

  return (
    <main className="pb-28">
      <h1 className="px-5 pt-8 font-serif text-[34px]">My stays</h1>
      <div role="tablist" className="mt-4 flex gap-6 border-b border-line px-5">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-[15px] capitalize ${
              tab === t ? "border-brand font-medium" : "border-transparent text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon="calendar"
          title={tab === "upcoming" ? "No upcoming stays" : "No past stays"}
          body="When you book a house, it appears here with check-in and access."
          action={<Button href="/">Explore stays</Button>}
        />
      ) : (
        <div className="space-y-4 px-5 pt-5">
          {list.map((b) => {
            const p = getProperty(b.slug);
            if (!p) return null;
            return (
              <button
                key={b.ref}
                type="button"
                className="block w-full text-left"
                onClick={() => {
                  setActive(b.ref);
                  router.push("/stay");
                }}
              >
                <Card className="flex items-center gap-4 !p-3">
                  <Photo src={heroOf(p)} alt="" className="size-24 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px]">
                      Confirmed
                    </span>
                    <h2 className="mt-2 truncate font-serif text-[20px] leading-tight">{p.name}</h2>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {fmtRange(b.checkIn, b.checkOut)} · {b.adults + b.children} guests
                    </p>
                  </div>
                  <Icon name="chevronRight" size={20} className="mr-1 text-muted" />
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
