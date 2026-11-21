"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "./Calendar";
import Icon from "./Icon";
import { Photo } from "./ui";
import { quote } from "@/lib/api";
import { getProperty, heroOf, properties, type Property } from "@/lib/data";
import { diffDays, fmtShort, yen } from "@/lib/dates";
import { GEO, JAPAN, JAPAN_PATH, project } from "@/lib/japan";
import { useToday } from "@/lib/store";

type Panel = "where" | "when" | null;

/** Japan with every bookable house pinned; the active one is highlighted. */
function JapanMap({ houses, active }: { houses: Property[]; active: Property }) {
  const [ax, ay] = project(...GEO[active.slug]);
  // Keep the label inside the frame whichever coast the pin is near.
  const labelLeft = ax > JAPAN.width * 0.6;

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-2xl bg-card">
      <svg
        viewBox={`0 0 ${JAPAN.width} ${JAPAN.height}`}
        className="size-full p-3"
        role="img"
        aria-label={`Map of Japan showing ${active.name} in ${active.area}, ${active.prefecture}`}
      >
        <path d={JAPAN_PATH} fill="#e3dacb" stroke="#d2c6b3" strokeWidth={0.6} />
        {houses.map((h) => {
          const [x, y] = project(...GEO[h.slug]);
          return <circle key={h.slug} cx={x} cy={y} r={3} fill="#5a4332" opacity={0.45} />;
        })}
        <g style={{ transform: `translate(${ax}px, ${ay}px)`, transition: "transform 0.5s ease" }}>
          <circle r={16} fill="#5a4332" opacity={0.14}>
            <animate attributeName="r" values="9;20;9" dur="2.4s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.28;0.04;0.28"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r={6.5} fill="#5a4332" stroke="#fff" strokeWidth={2.2} />
          <g transform={`translate(${labelLeft ? -14 : 14}, 0)`}>
            <text
              textAnchor={labelLeft ? "end" : "start"}
              y={-2}
              fontSize={15}
              fontWeight={600}
              fill="#222"
              stroke="#f7f4ef"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {active.area}
            </text>
            <text
              textAnchor={labelLeft ? "end" : "start"}
              y={15}
              fontSize={12}
              fill="#6a6a6a"
              stroke="#f7f4ef"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {active.prefecture} Prefecture
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function HeroSearch() {
  const router = useRouter();
  const today = useToday();
  const bookable = properties.filter((p) => p.bookable);

  const [slug, setSlug] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  const chosen = slug ? getProperty(slug)! : null;
  const onMap = getProperty(hovered ?? slug ?? bookable[0].slug)!;

  useEffect(() => {
    if (!panel) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
    };
  }, [panel]);

  function choose(s: string) {
    if (s !== slug) {
      // Each house has its own calendar, so earlier dates no longer apply.
      setCheckIn(null);
      setCheckOut(null);
    }
    setSlug(s);
    setHovered(null);
    setPanel("when");
  }

  function search() {
    if (!chosen) return setPanel("where");
    if (!checkIn || !checkOut) return setPanel("when");
    router.push(`/book/${chosen.slug}?in=${checkIn}&out=${checkOut}&adults=2`);
  }

  const q = chosen && checkIn && checkOut ? quote(chosen.slug, checkIn, checkOut, 2) : null;
  const field = (on: boolean) =>
    `flex flex-col rounded-full px-7 py-3 text-left transition ${
      on ? "bg-card shadow-soft" : "hover:bg-card"
    }`;
  const overlay =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6 text-left text-ink";
  const pop = "rise relative max-h-full overflow-y-auto rounded-[32px] bg-paper p-6 shadow-[0_24px_60px_rgb(0_0_0/0.3)]";
  const close = (
    <button
      type="button"
      aria-label="Close"
      onClick={() => setPanel(null)}
      className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-card"
    >
      <Icon name="close" size={20} />
    </button>
  );

  return (
    <div className="relative mt-12 w-full max-w-3xl">
      <div className="flex items-center rounded-full bg-paper p-2 text-ink shadow-soft">
        <button
          type="button"
          aria-expanded={panel === "where"}
          onClick={() => setPanel(panel === "where" ? null : "where")}
          className={`${field(panel === "where")} min-w-0 flex-1`}
        >
          <span className="text-[12px] font-semibold">Where</span>
          <span className={`truncate text-[15px] ${chosen ? "" : "text-muted"}`}>
            {chosen ? `${chosen.name} · ${chosen.area}, ${chosen.prefecture}` : "Choose a house"}
          </span>
        </button>
        <span className="h-9 w-px shrink-0 bg-line" />
        <button
          type="button"
          aria-expanded={panel === "when"}
          onClick={() => setPanel(panel === "when" ? null : chosen ? "when" : "where")}
          className={`${field(panel === "when")} w-56 shrink-0`}
        >
          <span className="text-[12px] font-semibold">When</span>
          <span className={`text-[15px] ${checkIn ? "" : "text-muted"}`}>
            {checkIn
              ? `${fmtShort(checkIn)} – ${checkOut ? fmtShort(checkOut) : "check-out"}`
              : "Add dates"}
          </span>
        </button>
        <button
          type="button"
          onClick={search}
          className="ml-2 flex h-14 shrink-0 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-white transition hover:opacity-90"
        >
          <Icon name="search" size={18} />
          Search
        </button>
      </div>

      {panel === "where" && (
        <div
          className={overlay}
          onPointerDown={(e) => e.target === e.currentTarget && setPanel(null)}
        >
        <div role="dialog" aria-modal="true" aria-label="Choose a house" className={`${pop} w-[920px]`}>
          <div className="flex items-center justify-between pb-4 pl-3">
            <div>
              <h2 className="text-[22px] font-semibold">Where would you like to stay?</h2>
              <p className="text-[14px] text-muted">Five houses are open for booking today.</p>
            </div>
            {close}
          </div>
          <div className="grid grid-cols-[1fr_380px] gap-5">
          <div>
            <ul onMouseLeave={() => setHovered(null)}>
              {bookable.map((p) => {
                const on = p.slug === slug;
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => choose(p.slug)}
                      onMouseEnter={() => setHovered(p.slug)}
                      onFocus={() => setHovered(p.slug)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-4 rounded-2xl p-2.5 text-left transition hover:bg-card ${
                        on ? "bg-card" : ""
                      }`}
                    >
                      <Photo src={heroOf(p)} alt="" className="size-14 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{p.name}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {p.area}, {p.prefecture} · sleeps {p.guests}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[13px] text-muted">
                        <span className="block text-[15px] font-medium text-ink">
                          {yen(p.baseRate)}
                        </span>
                        night
                      </span>
                      {on && <Icon name="check" size={18} className="shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <JapanMap houses={bookable} active={onMap} />
          </div>
        </div>
        </div>
      )}

      {panel === "when" && chosen && today && (
        <div
          className={overlay}
          onPointerDown={(e) => e.target === e.currentTarget && setPanel(null)}
        >
        <div role="dialog" aria-modal="true" aria-label="Choose dates" className={`${pop} w-[460px] !overflow-visible !p-0`}>
          <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
            <div className="flex-1">
              <p className="text-[15px] font-semibold">{chosen.name}</p>
              <p className="text-[13px] text-muted">
                {checkIn && !checkOut
                  ? "Now choose your check-out date"
                  : `Choose check-in · ${chosen.minStay}-night minimum`}
              </p>
            </div>
            {checkIn && (
              <button
                type="button"
                className="text-[13px] underline underline-offset-4"
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                }}
              >
                Clear
              </button>
            )}
            {close}
          </div>
          <div className="h-[min(420px,50vh)] overflow-y-auto px-2 pb-4">
            <Calendar
              slug={chosen.slug}
              today={today}
              minStay={chosen.minStay}
              checkIn={checkIn}
              checkOut={checkOut}
              stickyTop="top-0"
              onChange={(a, b) => {
                setCheckIn(a);
                setCheckOut(b);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
            <p className="text-[14px]" aria-live="polite">
              {q && checkIn && checkOut ? (
                <>
                  <span className="font-semibold">{yen(q.total)}</span>
                  <span className="text-muted">
                    {" "}
                    · {diffDays(checkIn, checkOut)} nights, fees included
                  </span>
                </>
              ) : (
                <span className="text-muted">Prices shown per night, in thousands of yen</span>
              )}
            </p>
            <button
              type="button"
              disabled={!q}
              onClick={search}
              className="h-11 shrink-0 rounded-full bg-brand px-5 text-[14px] font-medium text-white disabled:bg-faint"
            >
              Reserve
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
