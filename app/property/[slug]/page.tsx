import { Suspense } from "react";
import { notFound } from "next/navigation";
import PropertyView from "@/components/PropertyView";
import { getProperty, properties } from "@/lib/data";

export function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }));
}

async function Resolved({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProperty(slug)) notFound();
  return <PropertyView slug={slug} />;
}

export default function Page({ params }: PageProps<"/property/[slug]">) {
  return (
    <Suspense>
      <Resolved params={params} />
    </Suspense>
  );
}
