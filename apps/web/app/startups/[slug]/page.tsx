import type { Metadata } from "next";
import { DEMO_STARTUPS } from "@/lib/demo-startups";
import { StartupProfile } from "@/components/startup-profile";
export const metadata: Metadata = { title: "Startup profile" };
export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const demo = DEMO_STARTUPS.find((s) => s.slug === slug);
  return <StartupProfile slug={slug} initial={demo || null} />;
}
