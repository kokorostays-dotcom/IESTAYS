"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "./Calendar";
import Icon from "./Icon";
import { BottomBar, Button, Card, Field, Photo, ScreenHeader } from "./ui";
import { ApiError, confirmBooking, createHold, quote, type Hold, type Payment } from "@/lib/api";
import { getProperty, heroOf } from "@/lib/data";
import { diffDays, fmtLong, fmtRange, yen } from "@/lib/dates";
import { bookingConfirmed, useToday, type Booking } from "@/lib/store";

type Step = "dates" | "review" | "pay" | "done";
type HoldState =
  | { status: "loading" }
  | { status: "held"; hold: Hold }
  | { status: "unavailable" }
  | { status: "expired" };

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const btn =
    "grid size-9 place-items-center rounded-full border border-line bg-paper disabled:opacity-35";
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[15px]">{label}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className={btn}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className="w-5 text-center text-[15px] tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className={btn}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-[16px] font-medium" : "text-[14px]"}`}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function BookingFlow({ slug }: { slug: string }) {
  const p = getProperty(slug)!;
  const router = useRouter();
  const today = useToday();

  // Dates chosen on the listing page arrive in the URL and skip straight to payment.
  const params = useSearchParams();
  const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const preIn = params.get("in");
  const preOut = params.get("out");
  const preset = isDate(preIn) && isDate(preOut) && preIn < preOut;
  const preAdults = Math.min(p.guests, Math.max(1, Number(params.get("adults")) || 2));

  const [step, setStep] = useState<Step>(preset ? "pay" : "dates");
  const [checkIn, setCheckIn] = useState<string | null>(preset ? preIn : null);
  const [checkOut, setCheckOut] = useState<string | null>(preset ? preOut : null);
  const [adults, setAdults] = useState(preAdults);
  const [children, setChildren] = useState(0);

  const [holdState, setHoldState] = useState<HoldState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(0);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"apple_pay" | "card">("apple_pay");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const guests = adults + children;
  const q = checkIn && checkOut ? quote(slug, checkIn, checkOut, guests) : null;

  // Entering the pay step re-checks inventory and holds the dates.
  useEffect(() => {
    if (step !== "pay" || !checkIn || !checkOut) return;
    let live = true;
    createHold(slug, checkIn, checkOut)
      .then((hold) => {
        if (!live) return;
        setNow(Date.now());
        setHoldState({ status: "held", hold });
      })
      .catch((e) => {
        if (!live) return;
        // Only a real "dates taken" answer shows that screen; anything else can be retried.
        if (e instanceof ApiError && e.code !== "unavailable") setPayError(e.message);
        setHoldState({ status: e instanceof ApiError && e.code === "unavailable" ? "unavailable" : "expired" });
      });
    return () => {
      live = false;
    };
  }, [step, attempt, slug, checkIn, checkOut]);

  useEffect(() => {
    if (step !== "pay") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const remaining =
    holdState.status === "held" ? Math.max(0, holdState.hold.expiresAt - now) : 0;
  const expired =
    holdState.status === "expired" ||
    (holdState.status === "held" && now > 0 && remaining === 0);

  function goPay() {
    setHoldState({ status: "loading" });
    setPayError(null);
    setAttempt((a) => a + 1);
    setStep("pay");
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const nameOk = name.trim().length > 1;
  const cardOk =
    method === "apple_pay" ||
    (card.replace(/\s/g, "").length >= 12 && expiry.length >= 4 && cvc.length >= 3);

  async function pay() {
    setTouched(true);
    if (!emailOk || !nameOk || !cardOk || holdState.status !== "held") return;
    setPaying(true);
    setPayError(null);
    const payment: Payment =
      method === "card"
        ? { method, last4: card.replace(/\s/g, "").slice(-4) }
        : { method: "apple_pay" };
    try {
      const b = await confirmBooking({
        holdId: holdState.hold.id,
        name,
        email,
        adults,
        children,
        payment,
      });
      await bookingConfirmed(b.ref);
      setBooking(b);
      setStep("done");
    } catch (e) {
      if (e instanceof ApiError && e.code === "hold_expired") setHoldState({ status: "expired" });
      else setPayError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  /* ---------- Confirmed ---------- */
  if (step === "done" && booking) {
    return (
      <main className="px-5 pt-16 pb-10">
        <div className="pop mx-auto grid size-16 place-items-center rounded-full bg-brand text-paper">
          <Icon name="check" size={30} />
        </div>
        <h1 className="mt-6 text-center font-serif text-[32px] leading-tight">
          Your stay is booked
        </h1>
        <p className="mt-2 text-center text-[14px] text-muted">
          Booking reference <span className="font-medium text-ink">{booking.ref}</span>
        </p>

        <Card className="rise mt-7 flex gap-4 !p-3">
          <Photo src={heroOf(p)} alt="" className="size-24 shrink-0 rounded-2xl" />
          <div className="py-1">
            <h2 className="font-serif text-[20px] leading-tight">{p.name}</h2>
            <p className="mt-1 text-[13px] text-muted">
              {fmtRange(booking.checkIn, booking.checkOut)}
            </p>
            <p className="text-[13px] text-muted">
              {guests} {guests === 1 ? "guest" : "guests"} · {yen(booking.total)} paid
            </p>
          </div>
        </Card>

        <Card className="rise mt-4 flex gap-3.5">
          <Icon name="mail" className="mt-0.5 shrink-0 text-muted" />
          <p className="text-[14px] leading-relaxed">
            We&rsquo;ve emailed your confirmation and a secure sign-in link to{" "}
            <span className="font-medium [overflow-wrap:anywhere]">{booking.email}</span>. No password needed.
          </p>
        </Card>

        <div className="mt-8 space-y-3">
          <Button
            onClick={() => {
              router.push("/stay");
            }}
          >
            Open my stay
            <Icon name="arrowRight" size={18} />
          </Button>
          <Button variant="secondary" href="/email">
            Preview the email
          </Button>
        </div>
      </main>
    );
  }

  /* ---------- 1. Dates ---------- */
  if (step === "dates") {
    const nights = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;
    return (
      <main className="pb-36">
        <ScreenHeader
          title={p.name}
          fallback={`/property/${slug}`}
          right={
            checkIn && (
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
            )
          }
        />
        <div className="px-5 pb-2">
          <h2 className="font-serif text-[28px]">When would you like to stay?</h2>
          <p className="mt-1 text-[13px] text-muted">
            Live availability across all booking channels · {p.minStay}-night minimum
          </p>
        </div>

        {today ? (
          <Calendar
            slug={slug}
            today={today}
            minStay={p.minStay}
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(a, b) => {
              setCheckIn(a);
              setCheckOut(b);
            }}
          />
        ) : null}

        <BottomBar>
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1" aria-live="polite">
              {q ? (
                <>
                  <p className="text-[16px] font-medium">{yen(q.total)}</p>
                  <p className="truncate text-[12px] text-muted">
                    {nights} nights · fees included
                  </p>
                </>
              ) : (
                <p className="text-[14px] text-muted">
                  {checkIn ? "Now choose your check-out date" : "Choose your check-in date"}
                </p>
              )}
            </div>
            <Button className="!w-36" disabled={!q} onClick={() => setStep("review")}>
              Continue
            </Button>
          </div>
        </BottomBar>
      </main>
    );
  }

  if (!q || !checkIn || !checkOut) return null;

  const sameRate = q.nightly.every((n) => n.price === q.nightly[0].price);
  const summary = (
    <Card className="space-y-3">
      <Row
        label={sameRate ? `${yen(q.nightly[0].price)} × ${q.nights} nights` : `${q.nights} nights`}
        value={yen(q.subtotal)}
      />
      <Row label="Cleaning fee" value={yen(q.cleaningFee)} />
      <Row label="Accommodation tax" value={yen(q.tax)} />
      <div className="border-t border-line pt-3">
        <Row label="Total (JPY)" value={yen(q.total)} strong />
      </div>
    </Card>
  );

  /* ---------- 2. Review ---------- */
  if (step === "review") {
    return (
      <main className="px-0 pb-32">
        <ScreenHeader title="Review your stay" onBack={() => setStep("dates")} />
        <div className="space-y-4 px-5 pt-2">
          <Card className="flex gap-4 !p-3">
            <Photo src={heroOf(p)} alt="" className="size-24 shrink-0 rounded-2xl" />
            <div className="py-1">
              <p className="text-[11px] tracking-[0.18em] text-muted uppercase">{p.character}</p>
              <h2 className="mt-0.5 font-serif text-[20px] leading-tight">{p.name}</h2>
              <p className="mt-1 text-[13px] text-muted">
                {p.area}, {p.prefecture}
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-muted">Dates</p>
                <p className="mt-0.5 text-[15px]">{fmtLong(checkIn)}</p>
                <p className="text-[15px]">to {fmtLong(checkOut)}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("dates")}
                className="text-[13px] underline underline-offset-4"
              >
                Edit
              </button>
            </div>
            <div className="mt-4 divide-y divide-line border-t border-line">
              <Stepper
                label="Adults"
                hint="Age 13+"
                value={adults}
                min={1}
                max={p.guests - children}
                onChange={setAdults}
              />
              <Stepper
                label="Children"
                hint="Age 2–12"
                value={children}
                min={0}
                max={p.guests - adults}
                onChange={setChildren}
              />
            </div>
            <p className="pt-1 text-[12px] text-muted">This house sleeps up to {p.guests}.</p>
          </Card>

          {summary}

          <p className="flex gap-2.5 px-1 text-[13px] leading-relaxed text-muted">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
            Free cancellation up to 14 days before arrival. You won&rsquo;t need to create an
            account.
          </p>
        </div>
        <BottomBar>
          <Button onClick={goPay}>Continue to payment</Button>
        </BottomBar>
      </main>
    );
  }

  /* ---------- 3. Pay ---------- */
  if (holdState.status === "unavailable" || expired) {
    const gone = holdState.status === "unavailable";
    return (
      <main>
        <ScreenHeader title="Payment" onBack={() => setStep("review")} />
        <div className="rise flex flex-col items-center px-8 pt-20 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-brand-soft">
            <Icon name={gone ? "calendar" : "clock"} size={26} />
          </div>
          <h2 className="mt-5 font-serif text-2xl">
            {gone ? "Those dates were just taken" : "Your hold ran out"}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {gone
              ? "Someone booked them on another channel a moment ago. You have not been charged."
              : "We held your dates for 10 minutes. You have not been charged."}
          </p>
          <div className="mt-6 w-full">
            {gone ? (
              <Button
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                  setStep("dates");
                }}
              >
                Choose new dates
              </Button>
            ) : (
              <Button onClick={goPay}>Check availability again</Button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const mins = Math.floor(remaining / 60000);
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const held = holdState.status === "held";

  return (
    <main className="pb-36">
      <ScreenHeader title="Payment" onBack={() => !paying && setStep("review")} />
      <form
        className="space-y-5 px-5 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          pay();
        }}
        noValidate
      >
        <div
          className="flex items-center gap-2.5 rounded-2xl bg-brand-soft px-4 py-3 text-[13px]"
          aria-live="polite"
        >
          <Icon name="clock" size={18} />
          {held ? (
            <span>
              We&rsquo;re holding your dates for{" "}
              <span className="font-medium tabular-nums">
                {mins}:{secs}
              </span>
            </span>
          ) : (
            <span>Checking your dates are still free…</span>
          )}
        </div>

        <section className="space-y-4">
          <h2 className="font-serif text-[22px]">Your details</h2>
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="Your confirmation and sign-in link go here."
            error={touched && !emailOk ? "Enter a valid email address." : undefined}
          />
          <Field
            label="Full name"
            autoComplete="name"
            placeholder="As shown on your passport"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={touched && !nameOk ? "Enter the lead guest's name." : undefined}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-[22px]">Pay with</h2>
          <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-3">
            {(
              [
                ["apple_pay", "Apple Pay"],
                ["card", "Card"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={method === id}
                onClick={() => setMethod(id)}
                className={`h-14 rounded-2xl border text-[15px] font-medium transition ${
                  method === id ? "border-brand bg-card ring-1 ring-brand" : "border-line bg-card"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {method === "card" && (
            <div className="rise space-y-3">
              <Field
                label="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={card}
                onChange={(e) =>
                  setCard(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(.{4})(?=.)/g, "$1 "),
                  )
                }
                error={touched && !cardOk ? "Check your card details." : undefined}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM / YY"
                  value={expiry}
                  onChange={(e) =>
                    setExpiry(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4)
                        .replace(/(.{2})(?=.)/, "$1 / "),
                    )
                  }
                />
                <Field
                  label="Security code"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            </div>
          )}
          <p className="text-[12px] text-muted">
            Demo mode: no payment is taken. A card ending 0002 shows the declined state.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-[22px]">Price</h2>
          <p className="text-[13px] text-muted">
            {p.name} · {fmtRange(checkIn, checkOut)} · {guests}{" "}
            {guests === 1 ? "guest" : "guests"}
          </p>
          {summary}
        </section>

        {payError && (
          <p role="alert" className="flex gap-2.5 rounded-2xl bg-danger/10 px-4 py-3 text-[14px] text-danger">
            <Icon name="info" size={18} className="mt-0.5 shrink-0" />
            {payError}
          </p>
        )}

        <BottomBar>
          <Button type="submit" disabled={!held || paying}>
            {paying ? "Confirming your stay…" : `Confirm and pay ${yen(q.total)}`}
          </Button>
        </BottomBar>
      </form>
    </main>
  );
}
