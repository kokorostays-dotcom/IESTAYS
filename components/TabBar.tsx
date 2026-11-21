"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

const tabs: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/", label: "Discover", icon: "home", match: ["/"] },
  { href: "/saved", label: "Saved", icon: "heart", match: ["/saved"] },
  { href: "/stays", label: "Stays", icon: "calendar", match: ["/stays", "/stay"] },
  { href: "/profile", label: "Profile", icon: "user", match: ["/profile"] },
];

export default function TabBar() {
  const pathname = usePathname();
  const active = tabs.find((t) => t.match.includes(pathname));
  if (!active) return null;

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] lg:hidden -translate-x-1/2 border-t border-line bg-paper/95 pt-2 backdrop-blur"
    >
      <ul className="flex">
        {tabs.map((t) => {
          const on = t === active;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-1 text-[11px] ${on ? "font-medium text-ink" : "text-muted"}`}
              >
                <Icon name={t.icon} filled={on} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
