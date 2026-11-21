"use client";

import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import InstallApp from "@/components/InstallApp";
import { Button, Card } from "@/components/ui";
import { SUPPORT_EMAIL } from "@/lib/data";
import { resetAll, signOut, useAppState, useHydrated } from "@/lib/store";

function Item({
  icon,
  label,
  note,
  href,
}: {
  icon: IconName;
  label: string;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <Icon name={icon} className="text-muted" />
      <span className="flex-1 text-[15px]">{label}</span>
      {note && <span className="text-[13px] text-muted">{note}</span>}
      {href && <Icon name="chevronRight" size={18} className="text-muted" />}
    </>
  );
  const cls = "flex items-center gap-3 px-5 py-4";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function Profile() {
  const hydrated = useHydrated();
  const { sessionEmail } = useAppState();

  return (
    <main className="px-5 pb-28">
      <h1 className="pt-8 font-serif text-[34px]">Profile</h1>

      {hydrated && (
        <Card className="mt-5">
          {sessionEmail ? (
            <>
              <p className="text-[12px] text-muted">Signed in as</p>
              <p className="mt-0.5 text-[16px] font-medium [overflow-wrap:anywhere]">{sessionEmail}</p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-[22px]">Have a booking?</h2>
              <p className="mt-1 mb-4 text-[14px] text-muted">
                Sign in with the email you booked with. No password needed.
              </p>
              <Button href="/login">Log in</Button>
            </>
          )}
        </Card>
      )}

      <div className="mt-4">
        <InstallApp />
      </div>

      <div className="mt-4 rounded-3xl bg-brand p-5 text-paper">
        <div className="flex items-center gap-3">
          <Icon name="coin" />
          <h2 className="font-serif text-[22px]">Kokoro Coins</h2>
          <span className="ml-auto rounded-full border border-paper/40 px-2.5 py-1 text-[11px]">
            Coming soon
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed opacity-80">
          Credits to spend with local tea houses, restaurants and makers near your stay.
        </p>
      </div>

      <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-card shadow-soft">
        <Item icon="heart" label="Saved houses" href="/saved" />
        <Item icon="globe" label="Language" note="English" />
        <Item icon="coin" label="Currency" note="JPY ¥" />
        <Item icon="mail" label="Contact Kokoro" href={`mailto:${SUPPORT_EMAIL}`} />
      </div>

      {hydrated && (
        <div className="mt-6 space-y-1">
          {sessionEmail && (
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          )}
          {process.env.NODE_ENV !== "production" && (
            <Button
              variant="ghost"
              className="!text-muted"
              onClick={() => {
                if (window.confirm("Development only: delete every booking on the server and your saved houses?")) {
                  resetAll();
                }
              }}
            >
              Reset demo data
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
