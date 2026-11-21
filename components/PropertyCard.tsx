"use client";

import Link from "next/link";
import Icon from "./Icon";
import { Photo, SaveButton } from "./ui";
import { heroOf, type Property } from "@/lib/data";
import { yen } from "@/lib/dates";

export function PriceLine({ p }: { p: Property }) {
  return p.bookable ? (
    <span>
      From <span className="font-medium text-ink">{yen(p.baseRate)}</span> / night
    </span>
  ) : (
    <span>{p.status}</span>
  );
}

/** Large image-led card, used for the featured stay. */
export function FeatureCard({ p }: { p: Property }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] shadow-soft">
      <Link href={`/property/${p.slug}`} className="block">
        <Photo src={heroOf(p)} alt={p.name} priority className="aspect-[4/5] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">{p.character}</p>
            <h3 className="mt-1 font-serif text-[28px] leading-tight">{p.name}</h3>
            <p className="mt-0.5 text-[14px] opacity-90">
              {p.area}, {p.prefecture}
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/70">
            <Icon name="arrowRight" size={20} />
          </span>
        </div>
      </Link>
      <SaveButton slug={p.slug} className="absolute top-4 right-4" />
    </div>
  );
}

/** Full-width listing card. */
export function PropertyCard({ p }: { p: Property }) {
  return (
    <div className="relative">
      <Link href={`/property/${p.slug}`} className="block">
        <Photo src={heroOf(p)} alt={p.name} className="aspect-[4/3] w-full rounded-3xl" />
        <div className="mt-3 flex items-start justify-between gap-3 px-1">
          <div>
            <h3 className="font-serif text-[21px] leading-tight">{p.name}</h3>
            <p className="mt-0.5 text-[13px] text-muted">
              {p.area}, {p.prefecture} · {p.character}
            </p>
          </div>
        </div>
        <p className="mt-1.5 px-1 text-[13px] text-muted">
          <PriceLine p={p} />
        </p>
      </Link>
      <SaveButton slug={p.slug} className="absolute top-3 right-3" />
    </div>
  );
}

/** Compact card for horizontal rails. */
export function RailCard({ p }: { p: Property }) {
  return (
    <Link href={`/property/${p.slug}`} className="block w-[62%] shrink-0 snap-start">
      <Photo src={heroOf(p)} alt={p.name} className="aspect-[4/5] w-full rounded-3xl" />
      <h3 className="mt-2.5 px-1 font-serif text-[18px] leading-tight">{p.name}</h3>
      <p className="mt-0.5 px-1 text-[12px] text-muted">
        <PriceLine p={p} />
      </p>
    </Link>
  );
}
