"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui";
import { staffSetPassword } from "@/lib/store";

const noop = () => () => {};

/** Where a staff invitation or password-reset email lands. */
export default function SetPassword() {
  const router = useRouter();
  // The emailed link carries a one-time token after the "#"; null on the server.
  const hash = useSyncExternalStore(noop, () => window.location.hash, () => null);
  const token = hash === null ? null : new URLSearchParams(hash.slice(1)).get("access_token");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input =
    "h-12 w-full rounded-xl border border-line bg-paper px-4 text-[16px] placeholder:text-faint";

  return (
    <div className="grid min-h-dvh place-items-center bg-[#f6f5f3] p-6">
      <form
        noValidate
        className="w-full max-w-[400px] rounded-3xl border border-line bg-paper p-8 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!token) return;
          if (password.length < 10) return setError("Choose a password of at least 10 characters.");
          if (password !== again) return setError("The two passwords don't match.");
          setBusy(true);
          try {
            await staffSetPassword(token, password);
            router.replace("/admin");
          } catch (err) {
            setError(err instanceof Error ? err.message : "We couldn't save your password.");
            setBusy(false);
          }
        }}
      >
        <Logo />
        <h1 className="mt-8 text-[24px] font-semibold tracking-tight">Choose your password</h1>
        <p className="mt-1 text-[14px] text-muted">Kokoro back office</p>

        {hash !== null && !token ? (
          <p role="alert" className="mt-6 text-[14px] leading-relaxed text-muted">
            This link has expired or was already used. Ask an administrator to invite you again,
            or use &ldquo;Forgot your password?&rdquo; on the staff sign-in screen.
          </p>
        ) : (
          <>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-[13px] font-medium">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={input}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-medium">Type it again</span>
              <input
                type="password"
                autoComplete="new-password"
                value={again}
                onChange={(e) => {
                  setAgain(e.target.value);
                  setError(null);
                }}
                className={input}
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-[13px] text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !token}
              className="mt-6 h-12 w-full rounded-xl bg-brand text-[15px] font-medium text-white disabled:bg-faint"
            >
              {busy ? "Saving…" : "Save and sign in"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
