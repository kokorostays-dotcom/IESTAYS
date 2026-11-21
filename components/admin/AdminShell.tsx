"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "../Icon";
import { Logo } from "../ui";
import { ADMIN_ONLY, useAdminData } from "@/lib/admin";
import { staffSignIn, staffSignOut, useAppState } from "@/lib/store";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Today", icon: "home" },
  { href: "/admin/bookings", label: "Bookings", icon: "book" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
  { href: "/admin/finance", label: "Finance", icon: "coin" },
  { href: "/admin/inbox", label: "Inbox", icon: "chat" },
  { href: "/admin/guests", label: "Guests", icon: "users" },
  { href: "/admin/houses", label: "Houses", icon: "door" },
  { href: "/admin/team", label: "Team", icon: "shield" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { demoStaff } = useAppState();
  const input =
    "h-12 w-full rounded-xl border border-line bg-paper px-4 text-[16px] placeholder:text-faint";

  return (
    <div className="grid min-h-dvh place-items-center bg-[#f6f5f3] p-6">
      <form
        noValidate
        className="w-full max-w-[400px] rounded-3xl border border-line bg-paper p-8 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await staffSignIn(email, password);
          } catch (err) {
            setError(err instanceof Error ? err.message : "We couldn't sign you in.");
            setBusy(false);
          }
        }}
      >
        <Logo />
        <h1 className="mt-8 text-[24px] font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1 text-[14px] text-muted">Kokoro back office</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-[13px] font-medium">Work email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className={input}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
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
          disabled={busy}
          className="mt-6 h-12 w-full rounded-xl bg-brand text-[15px] font-medium text-white disabled:bg-faint"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {demoStaff && (
          <div className="mt-6 rounded-xl bg-card p-4 text-[13px] leading-relaxed text-muted">
            <p className="font-medium text-ink">Development accounts</p>
            {demoStaff.accounts.map((a) => (
              <p key={a.email}>
                {a.email} · {a.role}
              </p>
            ))}
            <p>Password for both: {demoStaff.password}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hydrated, staff } = useAdminData();

  // Until a staff member signs in, the sign-in screen covers the whole back
  // office. The shell stays mounted underneath so server and client match.
  const gated = !hydrated || !staff;
  const isAdmin = staff?.role === "Administrator";
  const items = nav.filter((n) => isAdmin || !ADMIN_ONLY.includes(n.href));
  const restricted = !isAdmin && ADMIN_ONLY.includes(pathname);

  return (
    <>
      {gated && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f6f5f3]">
          {hydrated && <Login />}
        </div>
      )}
    <div inert={gated} className="min-h-dvh bg-[#f6f5f3] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-line bg-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 lg:pb-6">
          <Logo />
          <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted">
            Back office
          </span>
        </div>
        <nav
          aria-label="Back office"
          className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-3 pb-3 lg:flex-1 lg:flex-col lg:border-0"
        >
          {items.map((n) => {
            const on = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${
                  on ? "bg-brand font-medium text-white" : "text-ink hover:bg-card"
                }`}
              >
                <Icon name={n.icon} size={19} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-line p-4 lg:block">
          <p className="text-[14px] font-medium">{staff?.name}</p>
          <p className="text-[12px] text-muted">{staff?.role}</p>
          <div className="mt-3 flex gap-4 text-[13px]">
            <Link href="/" className="underline underline-offset-4">
              Guest site
            </Link>
            <button type="button" onClick={staffSignOut} className="underline underline-offset-4">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 p-5 lg:p-9">
        {restricted ? (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center">
            <Icon name="lock" size={28} className="mx-auto" />
            <h1 className="mt-4 text-[20px] font-semibold">Administrators only</h1>
            <p className="mt-1 text-[14px] text-muted">
              Your role doesn&rsquo;t include this section.
            </p>
          </div>
        ) : (
          children
        )}
        <button
          type="button"
          onClick={staffSignOut}
          className="mt-8 text-[13px] underline underline-offset-4 lg:hidden"
        >
          Sign out {staff?.name}
        </button>
      </main>
    </div>
    </>
  );
}
