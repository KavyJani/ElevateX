import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  FileCheck2,
  LockKeyhole,
  MessagesSquare,
  MoveRight,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { StartupShowcase } from "@/components/startup-showcase";
import { PlatformStats } from "@/components/platform-stats";

const steps = [
  {
    n: "01",
    icon: <BookOpenCheck size={20} />,
    title: "Share the signal",
    body: "Founders shape a clear, structured picture of the company, its team, assumptions, and next milestone.",
  },
  {
    n: "02",
    icon: <ShieldCheck size={20} />,
    title: "Review with care",
    body: "Applications move through a visible review path. Verification status is distinct from investment eligibility.",
  },
  {
    n: "03",
    icon: <MessagesSquare size={20} />,
    title: "Start a conversation",
    body: "Investors can express interest. Founders decide what to share and with whom before a connection develops.",
  },
];

const values = [
  {
    icon: <BadgeCheck size={18} />,
    title: "Verification is a process",
    body: "Clear stages and human review. No badge means more than the checks behind it.",
  },
  {
    icon: <LockKeyhole size={18} />,
    title: "Private by default",
    body: "Sensitive documents and forecasts stay private until a founder chooses to share them.",
  },
  {
    icon: <ChartNoAxesColumnIncreasing size={18} />,
    title: "Assumptions in view",
    body: "Forecasts show their inputs, methodology, and uncertainty—not a promised outcome.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[#fbfcfe]">
        <div className="container grid min-h-[630px] items-center gap-9 py-14 lg:grid-cols-[.95fr_1.05fr] lg:py-20">
          <div className="relative z-10 max-w-[600px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce5fa] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#3154a0]">
              <span className="h-1.5 w-1.5 rounded-full bg-cobalt" /> A clearer
              path from potential to connection
            </div>
            <h1 className="display max-w-[640px] text-[56px] leading-[.99] text-ink sm:text-[68px] lg:text-[76px]">
              Make the next conversation{" "}
              <span className="text-cobalt">count.</span>
            </h1>
            <p className="mt-6 max-w-[505px] text-[16px] leading-[1.8] text-[#586579]">
              A thoughtful place for early-stage founders to share the full
              picture—and for investors to discover what could be next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join/founder" className="btn btn-primary">
                Join as a founder <ArrowUpRight size={16} />
              </Link>
              <Link href="/join/investor" className="btn btn-secondary">
                Join as an investor <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[#647086]">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-cobalt" /> Human-led
                review
              </span>
              <span className="flex items-center gap-2">
                <LockKeyhole size={14} className="text-cobalt" />{" "}
                Founder-controlled sharing
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[610px] lg:ml-auto">
            <div className="relative aspect-[1.16/1] overflow-hidden rounded-[22px] border border-[#e2e6ec] bg-[#f1f3f6] shadow-[0_24px_70px_rgba(27,42,68,.11)]">
              <img
                src="/manus-storage/async-images/39ZRnK9hQ8oCXnw6CxrkkX/image-1.webp"
                alt="Editorial illustration of founders and investors connected by an ascending line"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f8fa]/10 via-transparent to-transparent" />
            </div>
            <div className="absolute -left-3 bottom-7 max-w-[245px] rounded-xl border border-line bg-white/95 p-4 shadow-card sm:-left-7 sm:bottom-10">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#6b7586]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3b8a62]" />{" "}
                Founder-controlled access
              </div>
              <p className="mt-2 text-sm font-semibold leading-5 text-ink">
                Share the right information, at the right time.
              </p>
            </div>
            <div className="absolute -right-2 top-8 rounded-xl border border-[#dfe6f3] bg-white/95 px-4 py-3 shadow-card sm:-right-4 sm:top-12">
              <p className="text-[10px] font-bold uppercase tracking-[.11em] text-[#6b7586]">
                Built for better diligence
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#3154a0]">
                <FileCheck2 size={14} /> Context, not just a pitch
              </p>
            </div>
            <div className="absolute -bottom-9 right-1 hidden h-20 w-20 rounded-full border border-[#dbe4f7] bg-white/80 lg:block">
              <div className="absolute inset-[10px] rounded-full border border-[#dbe4f7]" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cobalt" />
            </div>
          </div>
        </div>
        <div className="container pb-12">
          <div className="border-t border-line pt-5 text-xs text-[#798396]">
            Public startup examples are illustrative demo content. ElevateX does
            not facilitate investment transactions or guarantee outcomes.
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="grid gap-8 border-b border-line pb-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">A more considered way to connect</p>
            <h2 className="display mt-3 max-w-[620px] text-[40px] leading-[1.05] sm:text-[50px]">
              The best introductions start with a better picture.
            </h2>
          </div>
          <Link className="btn btn-quiet w-fit" href="/explore">
            Explore startup profiles <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 pt-7 md:grid-cols-3">
          {steps.map((s) => (
            <article
              key={s.n}
              className="rounded-xl border border-line bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-cobalt">
                  {s.icon}
                </span>
                <span className="text-xs font-semibold tracking-[.12em] text-[#a4adbb]">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-6 text-[17px] font-semibold tracking-[-.02em]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f8f9fb] py-16 sm:py-20">
        <div className="container">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">The companies taking shape</p>
              <h2 className="display mt-3 text-[40px] leading-none sm:text-[48px]">
                Early ideas, clearly told.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                A glimpse of the kinds of profiles ElevateX is built to help
                founders present. Sample companies are fictional and labeled.
              </p>
            </div>
            <Link className="btn btn-secondary w-fit" href="/explore">
              Browse all profiles <MoveRight size={16} />
            </Link>
          </div>
          <StartupShowcase />
        </div>
      </section>

      <section id="how-it-works" className="container py-16 sm:py-20">
        <div className="grid gap-11 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Built on transparency</p>
            <h2 className="display mt-3 text-[41px] leading-[1.06] sm:text-[49px]">
              Trust is earned in the details.
            </h2>
            <p className="mt-4 max-w-[410px] text-sm leading-6 text-muted">
              The platform makes verification, private sharing, and financial
              assumptions visible—so no single badge or projection asks you to
              take too much on faith.
            </p>
            <Link href="/explore" className="btn btn-quiet mt-5">
              See what’s discoverable <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-3">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="grid grid-cols-[42px_1fr_auto] items-start gap-4 rounded-xl border border-line bg-white p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f0f4ff] text-cobalt">
                  {v.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{v.body}</p>
                </div>
                <span className="pt-1 text-[10px] font-bold tracking-[.12em] text-[#a7afbc]">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[#fbfcfe] py-14">
        <div className="container grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <p className="eyebrow">Platform snapshot</p>
            <h2 className="display mt-3 text-[38px] leading-[1.05]">
              Counts with context.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Only server-reported records belong here. Any development sample
              is marked as demo data.
            </p>
          </div>
          <PlatformStats />
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="grid gap-8 rounded-[18px] bg-[#172236] px-7 py-9 text-white sm:px-10 sm:py-11 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#b8c8ee]">
              <Sparkles size={15} /> INVESTO · your AI guide
            </div>
            <h2 className="display mt-4 max-w-[650px] text-[40px] leading-[1.03] sm:text-[48px]">
              Clearer questions. Better prepared conversations.
            </h2>
            <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#c3cad6]">
              INVESTO can explain onboarding and forecast assumptions when an AI
              provider is available. Static guidance remains available if it
              isn’t.
            </p>
          </div>
          <Link
            href="/investo"
            className="btn !bg-white !text-ink hover:!bg-[#edf1f8]"
          >
            Meet INVESTO <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-8 rounded-[18px] border border-[#e2e7f0] bg-[#f8faff] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Start with your perspective</p>
            <h2 className="display mt-3 text-[38px] leading-[1.05] sm:text-[45px]">
              A platform with room for both sides.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Join as a founder building the story, or as an investor looking to
              understand it.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link className="btn btn-primary" href="/join/founder">
              <UsersRound size={16} /> Join as a founder
            </Link>
            <Link className="btn btn-secondary" href="/join/investor">
              <Search size={16} /> Join as an investor
            </Link>
          </div>
        </div>
        <div className="mb-8 mt-8 flex items-center justify-center gap-2 text-xs text-[#7a8494]">
          <CircleHelp size={14} /> Questions?{" "}
          <Link className="font-semibold text-cobalt" href="/contact">
            Talk to the ElevateX team{" "}
            <ArrowUpRight size={12} className="inline" />
          </Link>
        </div>
      </section>
    </>
  );
}
