"use client";

import SignIn from "@/components/SignIn";
import { Button, Empty } from "@/components/ui";
import { useAppState, useHydrated } from "@/lib/store";

export default function Login() {
  const hydrated = useHydrated();
  const { sessionEmail } = useAppState();

  return (
    <main className="pb-28">
      {!hydrated ? null : sessionEmail ? (
        <Empty
          icon="user"
          title="You're logged in"
          body={`Signed in as ${sessionEmail}.`}
          action={<Button href="/stays">Go to my stays</Button>}
        />
      ) : (
        <SignIn />
      )}
    </main>
  );
}
