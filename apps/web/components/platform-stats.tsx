"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Building2, Globe2 } from "lucide-react";

type Snapshot = {
  source: "demo" | "database";
  counts: { startups: number; founders: number; industries: number };
};
export function PlatformStats() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/v1/startups/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v) => {
        if (live && v?.counts) setData(v);
      })
      .catch(() => {
        if (live) setUnavailable(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const items = data
    ? [
        {
          icon: <Building2 size={17} />,
          label: "Public startup profiles",
          value: data.counts.startups,
        },
        {
          icon: <BadgeCheck size={17} />,
          label: "Founder records",
          value: data.counts.founders,
        },
        {
          icon: <Globe2 size={17} />,
          label: "Industries represented",
          value: data.counts.industries,
        },
      ]
    : [];
  return (
    <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
      {data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#718096]">
              {data.source === "demo"
                ? "Development sample · demo data"
                : "Current platform records"}
            </p>
            {data.source === "demo" && (
              <span className="status-demo">DEMO</span>
            )}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.label}>
                <div className="flex items-center gap-2 text-cobalt">
                  {item.icon}
                  <span className="text-2xl font-semibold tabular-nums text-ink">
                    {item.value}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#d2a842]" />
            {unavailable
              ? "Live counts unavailable"
              : "Loading verified record counts"}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            {unavailable
              ? "No platform statistics are shown until a data source responds."
              : "Only backend-reported records will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
