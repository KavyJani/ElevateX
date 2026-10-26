import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ role: string; step: string }>;
}) {
  const { role, step } = await params;
  if ((role !== "investor" && role !== "founder") || !/^\d+$/.test(step))
    notFound();
  return <OnboardingWizard role={role} stepNumber={Number(step)} />;
}
