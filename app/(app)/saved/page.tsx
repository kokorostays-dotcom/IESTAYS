"use client";

import { PropertyCard } from "@/components/PropertyCard";
import { Button, Empty } from "@/components/ui";
import { properties } from "@/lib/data";
import { useAppState } from "@/lib/store";

export default function Saved() {
  const { saved } = useAppState();
  const list = properties.filter((p) => saved.includes(p.slug));

  return (
    <main className="pb-28">
      <h1 className="px-5 pt-8 font-serif text-[34px]">Saved</h1>
      {list.length === 0 ? (
        <Empty
          icon="heart"
          title="Nothing saved yet"
          body="Tap the heart on any house to keep it here for later."
          action={<Button href="/">Explore stays</Button>}
        />
      ) : (
        <div className="space-y-8 px-5 pt-6">
          {list.map((p) => (
            <PropertyCard key={p.slug} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
