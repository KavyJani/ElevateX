import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#142035] text-white">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.3fr_.7fr_.7fr] md:py-16">
        <div>
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5"
            aria-label="ElevateX home"
          >
            <img
              src="/icon.svg"
              alt=""
              className="h-8 w-8 rounded-[9px] border border-white/20"
            />
            <span className="text-[17px] font-bold tracking-[-.045em]">
              ElevateX
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#b6c0d0]">
            A considered space for founders and investors to find the right next
            conversation.
          </p>
          <p className="mt-5 max-w-md text-xs leading-5 text-[#98a5b9]">
            Startup discovery and scenario tools are informational. They are not
            offers, investment advice, valuation promises, or transaction
            services.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#9daac0]">
            Discover
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-[#e1e6ee]">
            <Link href="/explore" className="hover:text-white">
              Explore startups
            </Link>
            <Link href="/#how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/stories" className="hover:text-white">
              Sample stories
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#9daac0]">
            Get in touch
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-[#e1e6ee]">
            <Link
              href="/contact"
              className="flex items-center gap-2 hover:text-white"
            >
              Contact ElevateX <ArrowUpRight size={14} />
            </Link>
            <Link href="/sign-in" className="hover:text-white">
              Account access
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-3 py-5 text-xs text-[#9daac0] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 ElevateX. Built for considered connections.</span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/privacy" className="hover:text-white">
              Privacy draft
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms draft
            </Link>
            <Link href="/risk-disclosure" className="hover:text-white">
              Risk disclosure
            </Link>
            <span>Examples are illustrative demo content.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
