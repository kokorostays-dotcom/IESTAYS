import { Suspense } from "react";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";
import { getProperty, properties } from "@/lib/data";

export function generateStaticParams() {
  return properties.filter((p) => p.bookable).map((p) => ({ slug: p.slug }));
}

async function Resolved({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProperty(slug)?.bookable) notFound();
  return <BookingFlow slug={slug} />;
}

export default function Page({ params }: PageProps<"/book/[slug]">) {
  return (
    <Suspense>
      <Resolved params={params} />
    </Suspense>
  );
}
