import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InvestoLauncher } from "@/components/investo-chat";

export const metadata: Metadata = {
  title: {
    default: "ElevateX — Make the next conversation count",
    template: "%s · ElevateX",
  },
  description:
    "A considered place for founders to share their progress and for investors to discover early-stage companies.",
  applicationName: "ElevateX",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <InvestoLauncher />
      </body>
    </html>
  );
}
