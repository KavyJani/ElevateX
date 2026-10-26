"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { StartupCardData } from "@/lib/demo-startups";

type Facets = {
  industries: string[];
  stages: string[];
  businessModels: string[];
  locations: string[];
};
const emptyFacets: Facets = {
  industries: [],
  stages: [],
  businessModels: [],
  locations: [],
};
const perPage = 6;

export default function ExplorePage() {
  const [items, setItems] = useState<StartupCardData[]>([]);
  const [source, setSource] = useState<
    "loading" | "database" | "demo" | "unavailable"
  >("loading");
  const [message, setMessage] = useState("");
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [stage, setStage] = useState("All stages");
  const [business, setBusiness] = useState("All models");
  const [location, setLocation] = useState("All locations");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSource("loading");
      setMessage("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
        sort,
      });
      if (query.trim()) params.set("q", query.trim());
      if (industry !== "All industries") params.set("industry", industry);
      if (stage !== "All stages") params.set("stage", stage);
      if (business !== "All models") params.set("businessModel", business);
      if (location !== "All locations") params.set("location", location);
      try {
        const response = await fetch(`/api/v1/startups?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data.message ||
              `Discovery service unavailable (${response.status}).`,
          );
        if (!Array.isArray(data.items))
          throw new Error("Discovery returned an invalid result.");
        if (!live) return;
        setItems(data.items);
        setTotal(Number(data.total) || 0);
        setFacets({
          industries: Array.isArray(data.facets?.industries)
            ? data.facets.industries
            : [],
          stages: Array.isArray(data.facets?.stages) ? data.facets.stages : [],
          businessModels: Array.isArray(data.facets?.businessModels)
            ? data.facets.businessModels
            : [],
          locations: Array.isArray(data.facets?.locations)
            ? data.facets.locations
            : [],
        });
        setSource(data.source === "demo" ? "demo" : "database");
      } catch (error) {
        if (
          !live ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
        setItems([]);
        setTotal(0);
        setSource("unavailable");
        setMessage(
          error instanceof Error
            ? error.message
            : "Startup discovery is temporarily unavailable.",
        );
      }
    }, 220);
    return () => {
      live = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, industry, stage, business, location, sort, page]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  function clearFilters() {
    setQuery("");
    setIndustry("All industries");
    setStage("All stages");
    setBusiness("All models");
    setLocation("All locations");
    setPage(1);
  }
  const selectClass =
    "min-h-[43px] rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10";
  return (
    <div className="container py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Explore startups</p>
          <h1 className="display mt-3 text-[46px] leading-none sm:text-[57px]">
            A clearer first look.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Browse public profile details shared for discovery. Confidential
            information requires explicit permission.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef3ff] text-cobalt">
            <SlidersHorizontal size={15} />
          </span>
          Refine your search
        </div>
      </div>
      <div className="mt-9 rounded-xl border border-line bg-[#fbfcfe] p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search startups</span>
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d8796]"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, problem, industry, or location"
            className="h-12 w-full rounded-lg border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="field">
            <span className="text-xs">Industry</span>
            <select
              className={selectClass}
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                setPage(1);
              }}
            >
              <option>All industries</option>
              {facets.industries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="text-xs">Stage</span>
            <select
              className={selectClass}
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                setPage(1);
              }}
            >
              <option>All stages</option>
              {facets.stages.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="text-xs">Business model</span>
            <select
              className={selectClass}
              value={business}
              onChange={(e) => {
                setBusiness(e.target.value);
                setPage(1);
              }}
            >
              <option>All models</option>
              {facets.businessModels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="text-xs">Location</span>
            <select
              className={selectClass}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
            >
              <option>All locations</option>
              {facets.locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="text-xs">Sort by</span>
            <select
              className={selectClass}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="relevance">Most relevant</option>
              <option value="name">Name A–Z</option>
              <option value="stage">Stage</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Public profiles</h2>
          {source === "demo" && (
            <span className="status-demo">DEVELOPMENT DEMO</span>
          )}
          {source === "database" && (
            <span className="pill">Publicly shared</span>
          )}
        </div>
        <span className="text-xs text-muted">
          {source === "loading"
            ? "Loading profiles…"
            : `${total} ${total === 1 ? "profile" : "profiles"}`}
        </span>
      </div>
      {source === "unavailable" ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-line bg-canvas p-8 text-center"
        >
          <p className="font-semibold">
            Startup discovery is temporarily unavailable
          </p>
          <p className="mt-2 text-sm text-muted">{message}</p>
        </div>
      ) : source === "loading" && items.length === 0 ? (
        <div className="mt-5 animate-pulse rounded-xl bg-[#f2f4f7] p-12 text-center text-sm text-muted">
          Loading approved public profiles…
        </div>
      ) : items.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={`/startups/${item.slug}`}
              className="group rounded-xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${i % 3 === 0 ? "bg-[#e8f2ec] text-[#337d54]" : i % 3 === 1 ? "bg-[#faf1df] text-[#917338]" : "bg-[#e9efff] text-[#3456b2]"}`}
                >
                  {item.name
                    .split(" ")
                    .map((v) => v[0])
                    .join("")}
                </span>
                {(item.isDemo || source === "demo") && (
                  <span className="status-demo">DEMO PROFILE</span>
                )}
              </div>
              <h3 className="mt-5 text-lg font-semibold group-hover:text-cobalt">
                {item.name}
                <ArrowRight
                  size={15}
                  className="ml-1 inline opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                />
              </h3>
              <p className="mt-1 text-sm leading-5 text-muted">
                {item.tagline}
              </p>
              <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-[#7b8595]">
                {item.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[11px] font-medium text-[#737e90]">
                <span>
                  {item.industry} · {item.stage}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {item.location}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#d9dfe9] bg-[#fafbfd] px-6 py-14 text-center">
          <h3 className="font-semibold">No profiles match those filters</h3>
          <p className="mt-2 text-sm text-muted">
            Try a different term or clear a filter to see other results.
          </p>
          <button
            onClick={clearFilters}
            className="btn btn-secondary mt-5 !min-h-10"
          >
            Clear filters <X size={14} />
          </button>
        </div>
      )}
      <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
        <button
          disabled={page <= 1 || source === "loading"}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="btn btn-secondary !min-h-10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-muted">
          Page {page} of {pages}
        </span>
        <button
          disabled={page >= pages || source === "loading"}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="btn btn-secondary !min-h-10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
