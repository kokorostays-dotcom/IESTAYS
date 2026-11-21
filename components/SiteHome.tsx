"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import HeroSearch from "./HeroSearch";
import InstallApp from "./InstallApp";
import { Logo, Photo, SaveButton } from "./ui";
import { heroOf, properties, SUPPORT_EMAIL, type Property } from "@/lib/data";
import { yen } from "@/lib/dates";

// The machiya loop from ie.house. Swap for a 4K master when one exists
// (e.g. put hero-4k.mp4 in public/ and point VIDEO at "/hero-4k.mp4").
const VIDEO = "https://ie.house/videos/main-hero.mp4";
const POSTER = "https://ie.house/_astro/main-hero-poster.flSS3zME_1vgKhU.webp";

const desktop = "(min-width: 1024px)";
const motionOk = "(prefers-reduced-motion: no-preference)";

/** True only on wide screens that allow motion, so phones never fetch the film. */
function useShowFilm() {
  return useSyncExternalStore(
    (cb) => {
      const lists = [window.matchMedia(desktop), window.matchMedia(motionOk)];
      lists.forEach((m) => m.addEventListener("change", cb));
      return () => lists.forEach((m) => m.removeEventListener("change", cb));
    },
    () => window.matchMedia(desktop).matches && window.matchMedia(motionOk).matches,
    () => false,
  );
}

const kindOf = (p: Property) =>
  p.character.includes("Machiya")
    ? "Machiya"
    : p.character.includes("Estate")
      ? "Estate"
      : p.character.includes("Coastal")
        ? "Coastal house"
        : "Heritage house";

function ListingCard({ p }: { p: Property }) {
  return (
    <div className="group relative">
      <Link href={`/property/${p.slug}`} className="block">
        <div className="overflow-hidden rounded-2xl">
          <Photo
            src={heroOf(p)}
            alt={p.name}
            className="aspect-square w-full transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <h3 className="mt-3 truncate text-[15px] font-medium">
          {kindOf(p)} in {p.area}
        </h3>
        <p className="truncate text-[14px] text-muted">{p.name}</p>
        <p className="mt-0.5 text-[14px] text-muted">
          {p.bookable ? (
            <>
              <span className="font-medium text-ink">{yen(p.baseRate * 2)}</span> for 2 nights
            </>
          ) : (
            p.status
          )}
        </p>
      </Link>
      <SaveButton slug={p.slug} className="absolute top-3 right-3 !size-9" />
    </div>
  );
}

function Row({ title, items }: { title: string; items: Property[] }) {
  if (items.length === 0) return null;
  return (
    <section className="pt-14">
      <h2 className="text-[22px] font-medium">{title}</h2>
      <div className="mt-5 grid grid-cols-5 gap-x-5 gap-y-9">
        {items.map((p) => (
          <ListingCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}

export default function SiteHome() {
  const showFilm = useShowFilm();
  const bookable = properties.filter((p) => p.bookable);
  const soon = properties.filter((p) => !p.bookable);

  return (
    <main>
      {/* Hero: quiet, centred, film behind */}
      <section className="relative flex h-[calc(100dvh-84px)] min-h-[520px] items-center justify-center bg-[#221b16] text-white">
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={POSTER} alt="" className="absolute inset-0 size-full object-cover" />
          {showFilm && (
            <video
              src={VIDEO}
              poster={POSTER}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative flex w-full flex-col items-center px-10 text-center">
          <h1
            className="text-[46px] leading-[1.3] font-normal"
            style={{ fontFamily: 'var(--font-cormorant), "Times New Roman", serif' }}
          >
            Kokoro (心) means heart —
            <br />
            heritage homes restored
            <br />
            with care, for those who stay.
          </h1>
          <HeroSearch />
        </div>
      </section>

      <div id="stays" className="mx-auto max-w-[1440px] scroll-mt-6 px-10 pb-16">
        <Row title="Available now" items={bookable} />
        <Row
          title="Opening soon in Kyoto"
          items={soon.filter((p) => p.prefecture === "Kyoto")}
        />
        <Row
          title="Coming across Japan"
          items={soon.filter((p) => p.prefecture !== "Kyoto")}
        />
      </div>

      <InstallApp variant="banner" />

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-[1440px] items-start justify-between px-10 py-12">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-muted">
              Stewarding Japan&rsquo;s cultural assets: machiya, kominka and heritage estates
              reimagined as enduring places to stay.
            </p>
          </div>
          <div className="flex gap-20 text-[14px]">
            <div className="space-y-3">
              <p className="font-medium">Stay</p>
              <Link href="/#stays" className="block text-muted hover:underline">
                Our houses
              </Link>
              <Link href="/stays" className="block text-muted hover:underline">
                Find my booking
              </Link>
              <Link href="/saved" className="block text-muted hover:underline">
                Saved
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Contact</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="block text-muted hover:underline">
                {SUPPORT_EMAIL}
              </a>
              <a href="https://kokoro.co" className="block text-muted hover:underline">
                kokoro.co
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
