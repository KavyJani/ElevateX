import type { Metadata } from "next";
import { DashboardBoundary } from "@/components/dashboard-boundary";

export const metadata: Metadata = { title: "Admin review" };

export default function AdminDashboardPage() {
  return <DashboardBoundary role="admin" />;
}
