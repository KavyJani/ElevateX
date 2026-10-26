import type { Metadata } from "next";
import { DashboardBoundary } from "@/components/dashboard-boundary";

export const metadata: Metadata = { title: "Founder workspace" };

export default function FounderDashboardPage() {
  return <DashboardBoundary role="founder" />;
}
