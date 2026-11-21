"use client";

import { useState } from "react";
import Icon, { type IconName } from "./Icon";
import BookingCard from "./BookingCard";
import { BackButton, Button, Photo, RoundButton, SaveButton } from "./ui";
import {
  amenityLabel,
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  getProperty,
  photosOf,
  SUPPORT_EMAIL,
  type Amenity,
} from "@/lib/data";
import { yen } from "@/lib/dates";

const amenityIcon: Record<Amenity, IconName> = {
  wifi: "wifi",
  tatami: "tatami",
  kitchen: "kitchen",
  garden: "leaf",
  bath: "bath",
  parking: "car",
  sauna: "flame",
  washer: "washer",
  heating: "flame",
};

export default function PropertyView({ slug }: { slug: string }) {
  const p = getProperty(slug)!;
  const photos = photosOf(p);
  const [index, setIndex] = useState(0);
  const [shared, setShared] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // Share sheet dismissed.
    }
  }

  const facts: [IconName, string][] = [
    ["users", `${p.guests} guests`],
    ["bed", `${p.bedrooms} bedrooms`],
    ["bath", `${p.baths} ${p.baths === 1 ? "bath" : "baths"}`],
  ];
  const enquire = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(p.name)}`;
  const grid = photos.slice(0, 5);

  return (
    <main className="mx-auto max-w-[430px] pb-32 lg:max-w-6xl lg:px-8 lg:pt-8 lg:pb-24">
      {/* Desktop title row */}
      <div className="hidden items-center justify-between pb-5 lg:flex">
        <h1 className="text-[28px] font-medium">{p.name}</h1>
        <div className="flex gap-2">
          <RoundButton icon={shared ? "check" : "share"} label="Share" onClick={share} />
          <SaveButton slug={p.slug} />
        </div>
      </div>

      {/* Desktop gallery */}
      <div
        className={`hidden h-[480px] gap-2 overflow-hidden rounded-2xl lg:grid ${
          grid.length >= 5
            ? "grid-cols-4 grid-rows-2"
            : grid.length >= 3
              ? "grid-cols-3 grid-rows-2"
              : grid.length === 2
                ? "grid-cols-2"
                : ""
        }`}
      >
        {grid.slice(0, grid.length >= 5 ? 5 : grid.length >= 3 ? 3 : grid.length).map((src, i) => (
          <Photo
            key={src}
            src={src}
            alt={`${p.name}, photo ${i + 1}`}
            priority={i === 0}
            className={`size-full ${i === 0 && grid.length >= 3 ? "col-span-2 row-span-2" : ""}`}
          />
        ))}
      </div>

      {/* Mobile gallery */}
      <div className="relative lg:hidden">
        <div
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((src, i) => (
            <Photo
              key={src}
              src={src}
              alt={`${p.name}, photo ${i + 1}`}
              priority={i === 0}
              className="aspect-[4/5] w-full shrink-0 snap-center"
            />
          ))}
        </div>
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <BackButton />
          <div className="flex gap-2">
            <RoundButton icon={shared ? "check" : "share"} label="Share" onClick={share} />
            <SaveButton slug={p.slug} />
          </div>
        </div>
        {photos.length > 1 && (
          <span className="absolute right-4 bottom-10 rounded-full bg-black/55 px-2.5 py-1 text-[12px] text-white">
            {index + 1}/{photos.length}
          </span>
        )}
      </div>

      <div className="lg:mt-10 lg:grid lg:grid-cols-[1fr_400px] lg:gap-20">
        <div className="relative -mt-6 rounded-t-[28px] bg-paper px-5 pt-6 lg:mt-0 lg:rounded-none lg:p-0">
          <div className="lg:hidden">
            <p className="text-[11px] tracking-[0.2em] text-muted uppercase">{p.character}</p>
            <h1 className="mt-1.5 font-serif text-[34px] leading-[1.1]">{p.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px] text-muted">
              <Icon name="pin" size={16} />
              {p.area}, {p.prefecture}
            </p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-[22px] font-medium">
              Entire {p.character.includes("Machiya") ? "machiya" : "heritage house"} in {p.area},{" "}
              {p.prefecture}
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              {facts.map(([, label]) => label).join(" · ")}
            </p>
            <div className="mt-7 flex items-center gap-4 border-y border-line py-5">
              <span className="grid size-11 place-items-center rounded-full bg-brand text-[15px] font-medium text-white">
                K
              </span>
              <div>
                <p className="text-[15px] font-medium">Hosted by Kokoro Hospitality</p>
                <p className="text-[14px] text-muted">Restored and cared for by our own team</p>
              </div>
            </div>
            <ul className="space-y-5 pt-7">
              {(
                [
                  ["key", "Self check-in", "Check in online, then open the door from your phone."],
                  ["calendar", "Live calendar", "Dates shown are free across every booking channel."],
                  ["shield", "Free cancellation", "Cancel up to 14 days before arrival for a full refund."],
                ] as [IconName, string, string][]
              ).map(([icon, title, body]) => (
                <li key={title} className="flex gap-5">
                  <Icon name={icon} size={24} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[15px] font-medium">{title}</p>
                    <p className="text-[14px] text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-5 flex gap-2 lg:hidden">
            {facts.map(([icon, label]) => (
              <li
                key={label}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card py-3 text-[12px] lg:py-4 lg:text-[13px]"
              >
                <Icon name={icon} size={20} />
                {label}
              </li>
            ))}
          </ul>

          <section className="mt-7 border-t border-line pt-6 lg:mt-10 lg:pt-10">
            <h2 className="font-serif text-[22px] lg:text-[26px]">{p.tagline}</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted lg:text-[17px]">
              {p.description}
            </p>
          </section>

          <section className="mt-7 border-t border-line pt-6 lg:mt-10 lg:pt-10">
            <h2 className="font-serif text-[22px] lg:font-sans lg:font-medium">What this place offers</h2>
            <ul className="mt-4 grid grid-cols-2 gap-y-4 lg:grid-cols-3 lg:text-[15px]">
              {p.amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 text-[14px]">
                  <span className="grid size-10 place-items-center rounded-full bg-card">
                    <Icon name={amenityIcon[a]} size={18} />
                  </span>
                  {amenityLabel[a]}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-7 border-t border-line pt-6 lg:mt-10 lg:pt-10">
            <h2 className="font-serif text-[22px] lg:font-sans lg:font-medium">Things to know</h2>
            <dl className="mt-4 space-y-3 text-[14px] lg:max-w-md lg:text-[15px]">
              {[
                ["Check-in", `From ${CHECK_IN_TIME}, self check-in`],
                ["Check-out", `By ${CHECK_OUT_TIME}`],
                ["Minimum stay", `${p.minStay} nights`],
                ["Cancellation", "Free up to 14 days before arrival"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="hidden lg:block">
          <BookingCard p={p} />
        </aside>
      </div>

      {/* Mobile booking bar */}
      <div className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4 lg:hidden">
        <div className="flex items-center gap-4 rounded-[26px] bg-brand p-2.5 pl-5 text-white shadow-soft">
          {p.bookable ? (
            <>
              <div className="flex-1">
                <p className="text-[11px] opacity-70">From</p>
                <p className="text-[18px] font-medium">
                  {yen(p.baseRate)}
                  <span className="text-[12px] font-normal opacity-70"> / night</span>
                </p>
              </div>
              <Button
                href={`/book/${p.slug}`}
                variant="secondary"
                className="!h-13 !w-auto !border-0 !bg-white !px-5"
              >
                Check dates
                <Icon name="arrowRight" size={18} />
              </Button>
            </>
          ) : (
            <>
              <p className="flex-1 text-[15px] font-medium">{p.status}</p>
              <Button
                href={enquire}
                variant="secondary"
                className="!h-13 !w-auto !border-0 !bg-white !px-6"
              >
                Enquire
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
