"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  CircleHelp,
  Globe2,
  MapPin,
  Share2,
  ShieldCheck,
} from "lucide-react";
import type { StartupCardData } from "@/lib/demo-startups";

type Profile = StartupCardData & {
  problem?: string;
  solution?: string;
  market?: string;
  team?: string;
  publicNotes?: string;
  website?: string;
  fundingStage?: string;
};
export function StartupProfile({
  slug,
  initial,
}: {
  slug: string;
  initial: StartupCardData | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(initial);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/api/v1/startups/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v) => {
        if (live && v?.slug) setProfile({ ...v, isDemo: !!v.isDemo });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [slug]);
  async function action(endpoint: string, body: object) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const value = await r.json().catch(() => ({}));
        throw new Error(
          value?.message ||
            `Request could not be completed (${r.status}). Sign in or check service configuration.`,
        );
      }
      setNotice("Your request was received by the server.");
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : "Unable to reach the service. No request was saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!profile)
    return (
      <div className="container py-20">
        <Link href="/explore" className="btn btn-secondary">
          <ArrowLeft size={15} /> Back to explore
        </Link>
        <div className="mt-8 rounded-xl border border-line bg-canvas p-8">
          <h1 className="text-xl font-semibold">
            This public profile isn’t available.
          </h1>
          <p className="mt-2 text-sm text-muted">
            It may have been removed or is not approved for public sharing.
          </p>
        </div>
      </div>
    );
  return (
    <div className="container py-10 sm:py-14">
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#657186] hover:text-cobalt"
      >
        <ArrowLeft size={15} /> Back to explore
      </Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_330px]">
        <div>
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-2xl bg-[#eef3ff] text-lg font-bold text-cobalt">
                  {profile.name
                    .split(" ")
                    .map((v) => v[0])
                    .join("")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {profile.isDemo && (
                      <span className="status-demo">
                        FICTIONAL DEMO PROFILE
                      </span>
                    )}
                    <span className="pill">
                      <ShieldCheck size={12} /> Public profile
                    </span>
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
                    {profile.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted">{profile.tagline}</p>
                </div>
              </div>
              <button
                aria-label="Share profile"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setNotice("Profile link copied.");
                }}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-[#637085] hover:bg-canvas"
              >
                <Share2 size={16} />
              </button>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="pill">{profile.industry}</span>
              <span className="pill">{profile.stage}</span>
              <span className="pill">{profile.businessModel}</span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#758094]">
              <MapPin size={14} />
              {profile.location}
              {profile.website && (
                <>
                  <span>·</span>
                  <a
                    className="flex items-center gap-1 text-cobalt"
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe2 size={13} /> Website <ArrowUpRight size={12} />
                  </a>
                </>
              )}
            </div>
          </div>
          <section className="mt-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-cobalt">
              <CircleHelp size={14} /> Public information
            </div>
            <h2 className="mt-4 text-xl font-semibold">Company overview</h2>
            <p className="mt-3 text-sm leading-7 text-[#596579]">
              {profile.summary}
            </p>
            {profile.problem && (
              <div className="mt-7 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Problem</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {profile.problem}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Approach</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {profile.solution}
                  </p>
                </div>
              </div>
            )}
            {profile.market && (
              <div className="mt-6 border-t border-line pt-6">
                <h3 className="text-sm font-semibold">Market context</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {profile.market}
                </p>
              </div>
            )}
            <div className="mt-6 rounded-lg bg-[#f8f9fb] p-4 text-xs leading-5 text-[#697487]">
              Only information designated public by this company appears here.
              Private documents and forecasts require separate, explicit access
              grants. Profile visibility is not investment verification.
            </div>
          </section>
          {notice && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-[#dce5f3] bg-[#f4f7ff] p-3 text-sm text-[#34549c]"
            >
              {notice}
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-[92px] lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">
              Interested in a conversation?
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              An introduction request requires a verified account. The founder
              controls what they share next.
            </p>
            <button
              disabled={busy}
              onClick={() =>
                action("/api/v1/connections/interests", {
                  startupId: profile.id,
                })
              }
              className="btn btn-primary mt-5 w-full disabled:opacity-50"
            >
              {busy ? "Sending…" : "Request introduction"}
              <ArrowUpRight size={15} />
            </button>
            <button
              disabled={busy}
              onClick={() =>
                action("/api/v1/watchlist", { startupId: profile.id })
              }
              className="btn btn-secondary mt-2 w-full disabled:opacity-50"
            >
              <Bookmark size={15} /> Save profile
            </button>
            <div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">
              <p className="font-semibold text-ink">
                No transaction functionality
              </p>
              <p className="mt-1">
                ElevateX supports discovery and introductions, not investment
                execution, custody, or money movement.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
