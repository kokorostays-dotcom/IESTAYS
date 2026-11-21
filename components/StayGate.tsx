"use client";

import type { ReactNode } from "react";
import { Button, Empty } from "./ui";
import type { Property } from "@/lib/data";
import { useActiveStay, type Booking, type State } from "@/lib/store";

/** Renders its children only once a signed-in guest has a stay open. */
export default function StayGate({
  children,
}: {
  children: (ctx: { booking: Booking; property: Property; state: State }) => ReactNode;
}) {
  const { hydrated, booking, property, state } = useActiveStay();
  if (!hydrated) return null;
  if (!booking || !property) {
    return (
      <Empty
        icon="key"
        title="No stay open"
        body="Sign in with the link we emailed you to see your booking, check-in and access."
        action={<Button href="/login">Log in</Button>}
      />
    );
  }
  return <>{children({ booking, property, state })}</>;
}
