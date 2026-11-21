"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import SignIn from "./SignIn";
import { Logo } from "./ui";
import { useAppState } from "@/lib/store";

const links = [
  { href: "/#stays", label: "Stays" },
  { href: "/saved", label: "Saved" },
  { href: "/#app", label: "Get the app" },
];

/** Desktop navigation. Phones use the tab bar instead. */
export default function SiteNav() {
  const { sessionEmail } = useAppState();
  const pathname = usePathname();
  // The popup belongs to the page it was opened on, so navigating away closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname && !sessionEmail;

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="hidden h-[84px] items-center justify-between border-b border-line bg-paper px-10 lg:flex">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-8 text-[14px]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="underline-offset-8 hover:underline">
              {l.label}
            </Link>
          ))}
          {sessionEmail ? (
            <>
              <Link href="/stays" className="underline-offset-8 hover:underline">
                My stay
              </Link>
              <AccountLink email={sessionEmail} />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setOpenOn(pathname)}
                className="underline-offset-8 hover:underline"
              >
                My stay
              </button>
              <button
                type="button"
                onClick={() => setOpenOn(pathname)}
                className="flex h-11 items-center gap-2 rounded-full border border-line pr-4 pl-3 font-medium shadow-soft transition hover:bg-card"
              >
                <Icon name="user" size={20} />
                Log in
              </button>
            </>
          )}
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 hidden items-center justify-center bg-black/45 p-6 lg:flex"
          onPointerDown={(e) => e.target === e.currentTarget && setOpenOn(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Log in"
            className="rise relative w-full max-w-[440px] rounded-[28px] bg-paper pb-8 shadow-[0_24px_60px_rgb(0_0_0/0.3)]"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenOn(null)}
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-card"
            >
              <Icon name="close" size={20} />
            </button>
            <SignIn />
          </div>
        </div>
      )}
    </>
  );
}

/** The person icon: log in when signed out, profile when signed in. */
export function AccountLink({ email }: { email: string | null }) {
  return email ? (
    <Link
      href="/profile"
      aria-label={`Account, signed in as ${email}`}
      className="grid size-11 place-items-center rounded-full bg-brand text-[15px] font-medium text-white uppercase"
    >
      {email[0]}
    </Link>
  ) : (
    <Link
      href="/login"
      className="flex h-11 items-center gap-2 rounded-full border border-line pr-4 pl-3 font-medium shadow-soft transition hover:bg-card"
    >
      <Icon name="user" size={20} />
      Log in
    </Link>
  );
}
