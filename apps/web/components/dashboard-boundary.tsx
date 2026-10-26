import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

type Role = "founder" | "investor" | "admin";

export function DashboardBoundary({ role }: { role: Role }) {
  return (
    <Suspense
      fallback={
        <div role="status" className="container py-12 text-sm text-muted">
          Loading secure workspace…
        </div>
      }
    >
      <Dashboard role={role} />
    </Suspense>
  );
}
