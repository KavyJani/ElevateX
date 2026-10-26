import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DEMO_STARTUPS } from "@/lib/demo-startups";

export function StartupShowcase() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DEMO_STARTUPS.map((startup, index) => (
        <Link
          key={startup.id}
          href={`/startups/${startup.slug}`}
          className="group rounded-xl border border-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:shadow-card"
        >
          <div className="flex items-start justify-between">
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${index === 0 ? "bg-[#e8f2ec] text-[#337d54]" : index === 1 ? "bg-[#faf1df] text-[#917338]" : "bg-[#e9efff] text-[#3456b2]"}`}
            >
              {startup.name
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <span className="status-demo">DEMO PROFILE</span>
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-[-.02em] group-hover:text-cobalt">
            {startup.name}
            <ArrowUpRight
              size={15}
              className="ml-1 inline opacity-0 transition group-hover:opacity-100"
            />
          </h3>
          <p className="mt-1 min-h-[42px] text-sm leading-5 text-muted">
            {startup.tagline}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11px] font-medium text-[#737e90]">
            <span>
              {startup.industry} · {startup.stage}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {startup.location.split(",")[0]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
