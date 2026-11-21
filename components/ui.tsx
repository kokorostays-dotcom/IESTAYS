"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { toggleSaved, useAppState } from "@/lib/store";

const GLYPH =
  "M1003 2454 c-4 -10 -2 -19 4 -21 7 -3 49 -32 95 -66 110 -81 334 -306 378 -381 53 -90 93 -126 140 -126 65 0 88 37 81 129 -8 114 -159 242 -461 390 -184 90 -226 104 -237 75z M835 1919 c4 -19 10 -385 14 -814 6 -763 6 -781 27 -815 61 -105 194 -130 698 -130 456 0 659 22 769 82 34 19 43 29 45 55 3 28 -2 35 -36 57 -32 20 -40 32 -46 65 -6 39 4 225 24 441 14 149 14 150 -13 150 -22 0 -25 -8 -51 -132 -40 -192 -96 -407 -116 -448 -58 -114 -209 -146 -643 -137 -278 6 -379 18 -452 53 -68 32 -65 0 -65 757 l0 684 62 7 c131 13 110 58 -53 112 -57 19 -119 37 -138 40 l-34 7 8 -34z M2191 1583 c-7 -13 -1 -27 24 -58 157 -192 286 -451 329 -658 19 -96 38 -133 71 -141 70 -18 122 64 113 179 -11 129 -167 376 -356 563 -52 51 -153 132 -165 132 -3 0 -10 -8 -16 -17z M445 1438 c-30 -177 -127 -412 -213 -515 -61 -73 -72 -97 -72 -163 0 -113 86 -182 154 -122 89 80 168 375 183 685 5 114 4 140 -8 148 -27 17 -37 9 -44 -33z";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Kokoro home"
      className={`inline-flex items-center gap-3 leading-none ${className}`}
    >
      <svg viewBox="0 0 289 263" className="h-7 w-auto" aria-hidden="true">
        <g transform="translate(0,263) scale(0.1,-0.1)" fill="currentColor">
          <path d={GLYPH} />
        </g>
      </svg>
      <span>
        <span className="block text-[15px] font-medium tracking-[0.42em]">KOKORO</span>
        <span className="mt-1 block text-[7px] tracking-[0.5em] opacity-60">HOSPITALITY</span>
      </span>
    </Link>
  );
}

/** Photo with a calm fallback so a missing image never breaks a layout. */
export function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-[#8a735c] to-[#3d2e22] ${className}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={`bg-brand-soft object-cover ${className}`}
    />
  );
}

export function RoundButton({
  icon,
  label,
  onClick,
  filled,
  className = "",
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  filled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-full bg-card/95 text-ink shadow-soft backdrop-blur transition active:scale-95 ${className}`}
    >
      <Icon name={icon} size={20} filled={filled} />
    </button>
  );
}

export function SaveButton({ slug, className = "" }: { slug: string; className?: string }) {
  const saved = useAppState().saved.includes(slug);
  return (
    <RoundButton
      icon="heart"
      filled={saved}
      label={saved ? "Remove from saved" : "Save"}
      onClick={() => toggleSaved(slug)}
      className={className}
    />
  );
}

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <RoundButton
      icon="arrowLeft"
      label="Back"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    />
  );
}

/** Top bar for inner screens: back, centred title, optional right slot. */
export function ScreenHeader({
  title,
  fallback,
  right,
  onBack,
}: {
  title: string;
  fallback?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-paper/90 px-4 py-3 backdrop-blur">
      {onBack ? (
        <RoundButton icon="arrowLeft" label="Back" onClick={onBack} />
      ) : (
        <BackButton fallback={fallback} />
      )}
      <h1 className="flex-1 text-center text-[15px] font-medium">{title}</h1>
      <div className="flex size-10 items-center justify-center">{right}</div>
    </header>
  );
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-brand text-paper disabled:bg-faint",
    secondary: "bg-card text-ink border border-line",
    ghost: "text-ink underline underline-offset-4",
  }[variant];
  const cls = `flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-medium transition active:scale-[0.98] ${styles} ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** Action bar pinned to the bottom of the phone column. */
export function BottomBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-card p-5 shadow-soft ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  error,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className={`h-13 w-full rounded-2xl border bg-card px-4 text-[16px] placeholder:text-faint ${error ? "border-danger" : "border-line"}`}
      />
      {(error || hint) && (
        <span className={`mt-1.5 block text-[12px] ${error ? "text-danger" : "text-muted"}`}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

/** Shown when a screen needs a stay and the guest has none open. */
export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rise flex flex-col items-center px-8 pt-24 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-brand-soft">
        <Icon name={icon} size={26} />
      </div>
      <h2 className="mt-5 font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-6 w-full">{action}</div>}
    </div>
  );
}
