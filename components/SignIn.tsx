"use client";

import { useState } from "react";
import { Button, Empty, Field } from "./ui";
import { requestLink } from "@/lib/store";

/** Passwordless login: the guest's booking email gets a one-time sign-in link. */
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const clean = email.trim().toLowerCase();

  if (sent) {
    return (
      <Empty
        icon="mail"
        title="Check your inbox"
        body={`If ${clean} has a booking with us, a sign-in link is on its way. It works once.`}
        action={
          <div className="space-y-3">
            {devLink && (
              <a
                href={devLink}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand px-5 text-[15px] font-medium text-white"
              >
                Development: open the sign-in link
              </a>
            )}
            <Button variant="ghost" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <form
      noValidate
      className="rise px-5 pt-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError(true);
        setBusy(true);
        setFailed(null);
        try {
          setDevLink((await requestLink(clean)).devLink);
          setSent(true);
        } catch (err) {
          setFailed(err instanceof Error ? err.message : "We couldn't send the link.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="font-serif text-[34px] leading-tight">Log in</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Enter the email you booked with and we&rsquo;ll send a secure sign-in link. No password
        to remember.
      </p>
      <div className="mt-6 space-y-4">
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          error={error ? "Enter a valid email address." : undefined}
        />
        {failed && (
          <p role="alert" className="text-[13px] text-danger">
            {failed}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </div>
      <p className="mt-8 text-center text-[13px] text-muted">
        Booked on Agoda, Trip.com or another site? Use the email on that booking.
      </p>
    </form>
  );
}

