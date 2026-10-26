import type { Metadata } from "next";
import { InvestoChat } from "@/components/investo-chat";
export const metadata: Metadata = { title: "INVESTO assistant" };
export default function InvestoPage() {
  return (
    <div className="container py-10 sm:py-14">
      <div className="mb-6">
        <p className="eyebrow">INVESTO</p>
        <h1 className="display mt-2 text-[44px] leading-none sm:text-[54px]">
          Your AI guide to smarter startup decisions.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Choose a role and step for contextual questions. INVESTO uses only the
          configured AI service; if unavailable, it says so rather than
          inventing an answer. Static onboarding guidance remains available.
        </p>
      </div>
      <div className="mx-auto max-w-[820px]">
        <InvestoChat />
      </div>
      <p className="mx-auto mt-4 max-w-[820px] text-[10px] leading-5 text-[#8490a0]">
        AI output may be incorrect and is not verification, investment advice,
        or an admin decision. Do not include sensitive personal or financial
        information in general chat.
      </p>
    </div>
  );
}
