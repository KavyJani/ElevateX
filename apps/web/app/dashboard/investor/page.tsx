import type { Metadata } from "next";
import { DashboardBoundary } from "@/components/dashboard-boundary";

export const metadata: Metadata = { title: "Investor workspace" };

export default function InvestorDashboardPage() {
  return <DashboardBoundary role="investor" />;
}
