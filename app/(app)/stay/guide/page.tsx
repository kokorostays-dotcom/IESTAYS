"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import StayGate from "@/components/StayGate";
import { Photo, ScreenHeader } from "@/components/ui";
import { CHECK_IN_TIME, CHECK_OUT_TIME, heroOf } from "@/lib/data";

// Placeholder copy: each house will have its own guide from the staff CMS.
const WIFI = { network: "Kokoro-Guest", password: "machiya-quiet-2026" };

const sections: { icon: IconName; title: string; items: string[] }[] = [
  {
    icon: "door",
    title: "Arriving",
    items: [
      `Check-in is from ${CHECK_IN_TIME}. Your door code appears under Access.`,
      "Please remove your shoes in the genkan (entry). Slippers are in the cabinet.",
      "Luggage can be sent ahead by takkyubin; message us for the address format.",
    ],
  },
  {
    icon: "flame",
    title: "Heating, bath and appliances",
    items: [
      "Air conditioning remotes are on the wall in each room. Press the orange button for heat.",
      "To fill the bath, press the left button on the bathroom panel. It stops automatically.",
      "The induction hob needs the pans provided; others may not work.",
    ],
  },
  {
    icon: "tatami",
    title: "House rules",
    items: [
      "No shoes or wheeled luggage on tatami.",
      "Quiet after 21:00. This is a residential neighbourhood.",
      "No smoking anywhere in the house or garden.",
      "Registered guests only, please.",
    ],
  },
  {
    icon: "leaf",
    title: "Rubbish and recycling",
    items: [
      "Separate burnables, plastics, cans and bottles into the labelled bins.",
      "Leave everything inside; we collect after you check out.",
    ],
  },
  {
    icon: "clock",
    title: "Checking out",
    items: [
      `Check-out is by ${CHECK_OUT_TIME}.`,
      "Turn off the heating and lights, and close the windows.",
      "The door locks behind you. There is no key to return.",
    ],
  },
];

export default function GuidePage() {
  const [open, setOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  return (
    <main className="pb-10">
      <ScreenHeader title="House guide" fallback="/stay" />
      <StayGate>
        {({ property }) => (
          <div className="rise px-5 pt-2">
            <div className="relative overflow-hidden rounded-3xl">
              <Photo src={heroOf(property)} alt="" className="aspect-[16/9] w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h2 className="absolute bottom-4 left-5 font-serif text-[26px] text-white">
                {property.name}
              </h2>
            </div>

            <div className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <Icon name="wifi" />
                <h3 className="font-serif text-[20px]">Wi-Fi</h3>
              </div>
              <dl className="mt-3 space-y-1.5 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Network</dt>
                  <dd>{WIFI.network}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Password</dt>
                  <dd className="font-medium">{WIFI.password}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(WIFI.password);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  } catch {
                    // Clipboard blocked: the password is on screen to read.
                  }
                }}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line text-[14px] font-medium"
              >
                <Icon name={copied ? "check" : "copy"} size={16} />
                {copied ? "Copied" : "Copy password"}
              </button>
            </div>

            <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-card shadow-soft">
              {sections.map((s, i) => (
                <div key={s.title}>
                  <button
                    type="button"
                    aria-expanded={open === i}
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <Icon name={s.icon} className="text-muted" />
                    <span className="flex-1 text-[15px] font-medium">{s.title}</span>
                    <Icon
                      name="chevronDown"
                      size={18}
                      className={`text-muted transition-transform ${open === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open === i && (
                    <ul className="space-y-2.5 px-5 pb-5 text-[14px] leading-relaxed text-muted">
                      {s.items.map((t) => (
                        <li key={t} className="flex gap-2.5">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-clay" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </StayGate>
    </main>
  );
}
