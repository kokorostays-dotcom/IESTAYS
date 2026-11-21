"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import StayGate from "@/components/StayGate";
import { BottomBar, Button, Card, Field, ScreenHeader } from "@/components/ui";
import { CHECK_IN_TIME, type Property } from "@/lib/data";
import { fmtLong } from "@/lib/dates";
import { saveCheckIn, type Booking, type CheckIn } from "@/lib/store";

const arrivals = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "After 21:00"];

function Form({ booking, property }: { booking: Booking; property: Property }) {
  const [name, setName] = useState(booking.name);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [idAdded, setIdAdded] = useState(false);
  const [arrival, setArrival] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = {
    name: name.trim().length < 2,
    phone: phone.replace(/\D/g, "").length < 6,
    country: country.trim().length < 2,
    idAdded: !idAdded,
    arrival: !arrival,
    agreed: !agreed,
  };
  const ok = !Object.values(missing).some(Boolean);

  async function submit() {
    setTouched(true);
    if (!ok || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveCheckIn(booking.ref, {
        name: name.trim(),
        phone: phone.trim(),
        country: country.trim(),
        idAdded,
        arrival,
      });
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save your check-in.");
      setSaving(false);
    }
  }

  return (
    <form
      noValidate
      className="space-y-7 px-5 pt-2 pb-32"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <h2 className="font-serif text-[28px] leading-tight">Check in before you arrive</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          {property.name} · arriving {fmtLong(booking.checkIn)}. Once this is done, your door code
          is released on arrival day.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="font-serif text-[20px]">1. Lead guest</h3>
        <Field
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched && missing.name ? "Enter your full name." : undefined}
        />
        <Field
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+65 9000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Only used if we need to reach you during your stay."
          error={touched && missing.phone ? "Enter a phone number we can reach you on." : undefined}
        />
        <Field
          label="Country of residence"
          autoComplete="country-name"
          placeholder="Singapore"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          error={touched && missing.country ? "Enter your country of residence." : undefined}
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-[20px]">2. Passport</h3>
        <p className="text-[13px] leading-relaxed text-muted">
          Japanese law requires a passport copy for guests who live outside Japan.
        </p>
        <button
          type="button"
          onClick={() => setIdAdded((v) => !v)}
          aria-pressed={idAdded}
          className={`flex h-16 w-full items-center gap-3 rounded-2xl border border-dashed px-4 text-left text-[15px] ${
            idAdded ? "border-brand bg-brand-soft" : "border-faint bg-card"
          }`}
        >
          <Icon name={idAdded ? "check" : "plus"} size={20} />
          {idAdded ? "Passport photo added" : "Add a photo of your passport"}
        </button>
        {touched && missing.idAdded && (
          <p className="text-[12px] text-danger">Add your passport photo to continue.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-[20px]">3. Arrival time</h3>
        <p className="text-[13px] text-muted">Check-in opens at {CHECK_IN_TIME}.</p>
        <div role="radiogroup" aria-label="Estimated arrival time" className="flex flex-wrap gap-2">
          {arrivals.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={arrival === t}
              onClick={() => setArrival(t)}
              className={`h-11 rounded-full border px-4 text-[14px] ${
                arrival === t ? "border-brand bg-brand text-paper" : "border-line bg-card"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {touched && missing.arrival && (
          <p className="text-[12px] text-danger">Choose roughly when you&rsquo;ll arrive.</p>
        )}
      </section>

      <section>
        <label className="flex items-start gap-3 text-[14px] leading-relaxed">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-[#5a4332]"
          />
          I&rsquo;ve read the house rules: no shoes indoors, quiet after 21:00, no smoking, and
          registered guests only.
        </label>
        {touched && missing.agreed && (
          <p className="mt-2 text-[12px] text-danger">Please agree to the house rules.</p>
        )}
      </section>

      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}

      <BottomBar>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Complete check-in"}
        </Button>
      </BottomBar>
    </form>
  );
}

function Done({ checkin, booking }: { checkin: CheckIn; booking: Booking }) {
  return (
    <div className="px-5 pt-10">
      <div className="pop mx-auto grid size-16 place-items-center rounded-full bg-brand text-paper">
        <Icon name="check" size={30} />
      </div>
      <h2 className="mt-6 text-center font-serif text-[30px] leading-tight">
        You&rsquo;re checked in
      </h2>
      <p className="mt-2 text-center text-[14px] leading-relaxed text-muted">
        Your door code is released at {CHECK_IN_TIME} on {fmtLong(booking.checkIn)}.
      </p>
      <Card className="mt-7 space-y-2.5 text-[14px]">
        {[
          ["Lead guest", checkin.name],
          ["Mobile", checkin.phone],
          ["Arriving around", checkin.arrival],
          ["Passport", "Received"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-muted">{k}</span>
            <span className="text-right">{v}</span>
          </div>
        ))}
      </Card>
      <div className="mt-6 space-y-3">
        <Button href="/stay/access">
          View access details
          <Icon name="arrowRight" size={18} />
        </Button>
        <Button variant="secondary" href="/stay">
          Back to my stay
        </Button>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <main>
      <ScreenHeader title="Online check-in" fallback="/stay" />
      <StayGate>
        {({ booking, property, state }) => {
          const done = state.checkins[booking.ref];
          return done ? (
            <Done checkin={done} booking={booking} />
          ) : (
            <Form booking={booking} property={property} />
          );
        }}
      </StayGate>
    </main>
  );
}
