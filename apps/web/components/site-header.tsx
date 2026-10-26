"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [
    ["Explore startups", "/explore"],
    ["How it works", "/#how-it-works"],
    ["Stories", "/stories"],
    ["For investors", "/join/investor"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-[72px] items-center justify-between">
        <Link
          href="/"
          aria-label="ElevateX home"
          className="flex items-center gap-2.5"
        >
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-[9px]" />
          <span className="text-[17px] font-bold tracking-[-.045em]">
            Elevate<span className="text-cobalt">X</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] font-medium text-[#576276] transition hover:text-cobalt"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-5 md:flex">
          <Link
            className="text-[13px] font-semibold text-ink hover:text-cobalt"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="btn btn-primary !min-h-[40px] !rounded-[8px] !px-4 !text-[13px]"
            href="/join/founder"
          >
            Join ElevateX <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open && (
        <nav
          className="border-t border-line bg-white px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="container grid gap-1">
            {links.map(([label, href]) => (
              <Link
                onClick={() => setOpen(false)}
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-canvas"
              >
                {label}
              </Link>
            ))}
            <Link
              onClick={() => setOpen(false)}
              href="/sign-in"
              className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-canvas"
            >
              Sign in
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/join/founder"
              className="btn btn-primary mt-2"
            >
              Join ElevateX <ArrowUpRight size={15} />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
