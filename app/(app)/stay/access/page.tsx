"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import StayGate from "@/components/StayGate";
import { Button, Card, ScreenHeader } from "@/components/ui";
import { doorCode } from "@/lib/api";
import { CHECK_IN_TIME, CHECK_OUT_TIME, SUPPORT_PHONE, type Property } from "@/lib/data";
import { fmtLong } from "@/lib/dates";
import { setPreviewArrival, useToday, type Booking } from "@/lib/store";

function Unlocked({ booking, property }: { booking: Booking; property: Property }) {
  const code = doorCode(booking.ref);
  const [copied, setCopied] = useState(false);
  const [door, setDoor] = useState<"idle" | "working" | "open">("idle");

  function unlock() {
    setDoor("working");
    setTimeout(() => {
      setDoor("open");
      setTimeout(() => setDoor("idle"), 4000);
    }, 1300);
  }

  return (
    <>
      <div className="rounded-[28px] bg-brand p-6 text-paper shadow-soft">
        <p className="text-[12px] tracking-[0.2em] uppercase opacity-70">Front door code</p>
        <p
          className="mt-3 font-serif text-[52px] leading-none tracking-[0.12em] tabular-nums"
          aria-label={`Door code ${code.split("").join(" ")}`}
        >
          {code.slice(0, 3)} {code.slice(3)}
        </p>
        <p className="mt-3 text-[13px] opacity-80">
          Valid until {CHECK_OUT_TIME} on {fmtLong(booking.checkOut)}. Press # after the code.
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              // Clipboard blocked: the code is on screen to read.
            }
          }}
          className="mt-5 flex h-11 items-center gap-2 rounded-full border border-paper/40 px-4 text-[14px]"
        >
          <Icon name={copied ? "check" : "copy"} size={16} />
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      <Button onClick={unlock} disabled={door !== "idle"} className="mt-4 !h-16">
        <Icon name={door === "open" ? "unlock" : "lock"} size={20} />
        <span aria-live="polite">
          {door === "idle" && "Unlock from my phone"}
          {door === "working" && "Unlocking…"}
          {door === "open" && "Door unlocked"}
        </span>
      </Button>
      <p className="mt-2 text-center text-[12px] text-muted">
        Works when you are standing at the door of {property.name}.
      </p>
    </>
  );
}

function Locked({ icon, title, body, action }: {
  icon: "lock" | "door";
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] bg-card p-6 text-center shadow-soft">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft">
        <Icon name={icon} size={26} />
      </div>
      <h2 className="mt-4 font-serif text-[24px] leading-tight">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function AccessPage() {
  const today = useToday();

  return (
    <main className="pb-10">
      <ScreenHeader title="Access" fallback="/stay" />
      <StayGate>
        {({ booking, property, state }) => {
          const checkedIn = !!state.checkins[booking.ref];
          const arrived =
            !!today && today >= booking.checkIn && today <= booking.checkOut;
          const open = checkedIn && (arrived || state.previewArrival);

          return (
            <div className="rise space-y-4 px-5 pt-2">
              {!checkedIn ? (
                <Locked
                  icon="door"
                  title="Check in to get your code"
                  body="Complete online check-in first. It takes about two minutes."
                  action={<Button href="/stay/check-in">Start check-in</Button>}
                />
              ) : open ? (
                <div>
                  <Unlocked booking={booking} property={property} />
                </div>
              ) : (
                <Locked
                  icon="lock"
                  title="Your code is on its way"
                  body={`It appears here at ${CHECK_IN_TIME} on ${fmtLong(booking.checkIn)} and we'll email it to you too.`}
                />
              )}

              <Card>
                <h3 className="font-serif text-[20px]">Getting there</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  {property.name}, {property.area}, {property.prefecture}. Look for the wooden
                  lattice front and the small Kokoro plaque beside the door.
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${property.area} ${property.prefecture} Japan`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl border border-line text-[14px] font-medium"
                >
                  <Icon name="pin" size={18} />
                  Open in Maps
                </a>
              </Card>

              <Card>
                <h3 className="font-serif text-[20px]">Can&rsquo;t get in?</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  If the lock doesn&rsquo;t respond, a backup key is in the lockbox to the right of
                  the door. Call us and we&rsquo;ll give you its combination.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand text-[14px] font-medium text-paper"
                  >
                    <Icon name="phone" size={18} />
                    Call us
                  </a>
                  <Button variant="secondary" href="/stay/messages" className="!h-12">
                    <Icon name="chat" size={18} />
                    Message
                  </Button>
                </div>
              </Card>

              {checkedIn && !arrived && (
                <label className="flex items-center justify-between rounded-2xl border border-dashed border-faint px-4 py-3 text-[13px] text-muted">
                  Demo: preview arrival day
                  <input
                    type="checkbox"
                    checked={state.previewArrival}
                    onChange={(e) => setPreviewArrival(e.target.checked)}
                    className="size-5 accent-[#5a4332]"
                  />
                </label>
              )}
            </div>
          );
        }}
      </StayGate>
    </main>
  );
}
