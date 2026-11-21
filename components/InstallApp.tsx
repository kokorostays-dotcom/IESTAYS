"use client";

import { useState, useSyncExternalStore } from "react";
import Icon from "./Icon";

// The browser offers installation through this event (Chrome, Edge, Android).
// Safari on iPhone has no such event, so we show its two steps instead.
type InstallEvent = Event & { prompt: () => Promise<{ outcome: "accepted" | "dismissed" }> };

let offer: InstallEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    offer = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    offer = null;
    listeners.forEach((l) => l());
  });
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

type Mode = "installed" | "prompt" | "ios" | "manual";

function detect(): Mode {
  if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
  if (offer) return "prompt";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios";
  return "manual";
}

export default function InstallApp({ variant = "card" }: { variant?: "card" | "banner" }) {
  const mode = useSyncExternalStore<Mode | null>(subscribe, detect, () => null);
  const [help, setHelp] = useState(false);
  if (!mode || mode === "installed") return null;

  async function install() {
    if (mode === "prompt" && offer) {
      await offer.prompt();
      offer = null;
      listeners.forEach((l) => l());
    } else setHelp((v) => !v);
  }

  const steps =
    mode === "ios"
      ? ["Tap the Share button in Safari.", "Choose “Add to Home Screen”.", "Tap Add."]
      : [
          "Open this site in Chrome, Edge or Safari.",
          "Open the browser menu.",
          "Choose “Install app” or “Add to Home Screen”.",
        ];

  const body = (
    <>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="size-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h2 className={variant === "banner" ? "text-[26px] font-semibold tracking-tight" : "text-[17px] font-semibold"}>
            Get the Kokoro app
          </h2>
          <p className={`text-muted ${variant === "banner" ? "mt-1 text-[15px]" : "text-[13px]"}`}>
            Your booking, check-in and door code on your home screen. No app store needed.
          </p>
        </div>
        {variant === "banner" && (
          <button
            type="button"
            onClick={install}
            aria-expanded={mode === "prompt" ? undefined : help}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-white hover:opacity-90"
          >
            <Icon name="plus" size={18} />
            Install app
          </button>
        )}
      </div>
      {variant === "card" && (
        <button
          type="button"
          onClick={install}
          aria-expanded={mode === "prompt" ? undefined : help}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-[15px] font-medium text-white"
        >
          <Icon name="plus" size={18} />
          Install app
        </button>
      )}
      {help && (
        <ol className="rise mt-4 space-y-2 text-[14px]">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] font-semibold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      )}
    </>
  );

  return variant === "banner" ? (
    <section id="app" className="mx-auto max-w-[1440px] scroll-mt-6 px-10 pb-20">
      <div className="rounded-3xl bg-card p-8">{body}</div>
    </section>
  ) : (
    <div className="rounded-3xl bg-card p-5 shadow-soft">{body}</div>
  );
}
