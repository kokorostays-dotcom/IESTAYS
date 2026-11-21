"use client";

import { useRouter } from "next/navigation";
import { Button, Empty, Photo, ScreenHeader } from "@/components/ui";
import { CHECK_IN_TIME, getProperty, heroOf } from "@/lib/data";
import { fmtLong, yen } from "@/lib/dates";
import { setActive, useAppState, useHydrated } from "@/lib/store";

/** A preview of the confirmation email, so the passwordless flow can be demoed. */
export default function EmailPreview() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { bookings, lastEmailRef } = useAppState();
  const b = bookings.find((x) => x.ref === lastEmailRef) ?? bookings.at(-1);
  const p = b && getProperty(b.slug);

  return (
    <main className="pb-10">
      <ScreenHeader title="Email preview" fallback="/stays" />
      {!hydrated ? null : !b || !p ? (
        <Empty
          icon="mail"
          title="No email yet"
          body="Book a stay and the confirmation email appears here."
          action={<Button href="/">Explore stays</Button>}
        />
      ) : (
        <div className="rise px-4 pt-2">
          <div className="rounded-t-2xl border border-line bg-card px-4 py-3 text-[13px]">
            <p className="font-medium">Your stay at {p.name} is confirmed</p>
            <p className="mt-1 text-muted">From: Kokoro Hospitality &lt;stay@kokoro.co&gt;</p>
            <p className="[overflow-wrap:anywhere] text-muted">To: {b.email}</p>
          </div>
          <div className="rounded-b-2xl border border-t-0 border-line bg-white px-5 py-7">
            <p className="text-center text-[13px] font-medium tracking-[0.42em]">KOKORO</p>
            <Photo src={heroOf(p)} alt="" className="mt-6 aspect-[16/9] w-full rounded-xl" />
            <h2 className="mt-6 font-serif text-[26px] leading-tight">
              {b.name.split(" ")[0]}, your stay is confirmed.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Thank you for booking with Kokoro. Everything for your stay lives in one place:
              online check-in, your door code, the house guide and a direct line to us.
            </p>

            <table className="mt-5 w-full text-[14px]">
              <tbody>
                {[
                  ["Reference", b.ref],
                  ["House", p.name],
                  ["Check-in", `${fmtLong(b.checkIn)}, from ${CHECK_IN_TIME}`],
                  ["Check-out", fmtLong(b.checkOut)],
                  ["Guests", String(b.adults + b.children)],
                  ["Paid", yen(b.total)],
                ].map(([k, v]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-2.5 pr-3 align-top text-muted">{k}</td>
                    <td className="py-2.5 text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              className="mt-6"
              onClick={() => {
                setActive(b.ref);
                router.push("/stay");
              }}
            >
              Open my stay
            </Button>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
              This button signs you in securely. No password needed. The link is personal to you,
              so please don&rsquo;t forward this email.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
