"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { FeatureCard, PropertyCard, RailCard } from "@/components/PropertyCard";
import { AccountLink } from "@/components/SiteNav";
import { Logo } from "@/components/ui";
import { useAppState } from "@/lib/store";
import { prefectures, properties } from "@/lib/data";

const filters = ["All", ...prefectures] as const;

export default function Discover() {
  const { sessionEmail } = useAppState();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof filters)[number]>("All");

  const q = query.trim().toLowerCase();
  const matches = properties.filter(
    (p) =>
      (region === "All" || p.prefecture === region) &&
      (!q || `${p.name} ${p.area} ${p.prefecture} ${p.character}`.toLowerCase().includes(q)),
  );
  const browsing = !q && region === "All";
  const bookable = properties.filter((p) => p.bookable);
  const soon = properties.filter((p) => !p.bookable);

  return (
    <main className="mx-auto max-w-[430px] pb-28">
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo />
        <AccountLink email={sessionEmail} />
      </header>

      <div className="px-5 pt-7">
        <h1 className="font-serif text-[34px] leading-[1.1]">
          Stay in Japan&rsquo;s
          <br />
          heritage homes
        </h1>

        <label className="mt-5 flex h-14 items-center gap-3 rounded-2xl bg-card px-4 shadow-soft">
          <Icon name="search" size={20} className="text-muted" />
          <span className="sr-only">Search stays</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Kyoto, Niigata, machiya…"
            className="h-full flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={region === f}
            onClick={() => setRegion(f)}
            className={`h-10 shrink-0 rounded-full border px-4 text-[14px] transition ${
              region === f ? "border-brand bg-brand text-paper" : "border-line bg-card"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {browsing ? (
        <>
          <section className="rise px-5 pt-6">
            <FeatureCard p={bookable[0]} />
          </section>

          <section className="pt-9">
            <h2 className="px-5 font-serif text-[24px]">Book now</h2>
            <div className="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto scroll-px-5 px-5">
              {bookable.slice(1).map((p) => (
                <RailCard key={p.slug} p={p} />
              ))}
            </div>
          </section>

          <section className="px-5 pt-10">
            <h2 className="font-serif text-[24px]">Opening soon</h2>
            <p className="mt-1 text-[13px] text-muted">
              Houses and estates currently being restored.
            </p>
            <div className="mt-5 space-y-8">
              {soon.map((p) => (
                <PropertyCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="px-5 pt-6">
          <p className="text-[13px] text-muted" aria-live="polite">
            {matches.length} {matches.length === 1 ? "stay" : "stays"}
          </p>
          {matches.length === 0 ? (
            <p className="pt-10 text-center text-[14px] text-muted">
              Nothing matches that search yet. Try another region.
            </p>
          ) : (
            <div className="mt-4 space-y-8">
              {matches.map((p) => (
                <PropertyCard key={p.slug} p={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
