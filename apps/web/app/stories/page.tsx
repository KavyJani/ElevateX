import type { Metadata } from "next";
import { BookOpenCheck, Compass, FileSearch2 } from "lucide-react";
export const metadata: Metadata = { title: "Sample stories" };
const examples = [
  {
    icon: <Compass size={19} />,
    title: "Finding the useful question",
    company: "Sample founder story · Fictional",
    body: "An idea-stage founder turns a broad market claim into a smaller set of assumptions they can explain and revisit.",
  },
  {
    icon: <FileSearch2 size={19} />,
    title: "Sharing with intention",
    company: "Sample diligence story · Fictional",
    body: "A founder separates public profile details from confidential forecasts and chooses what to share in a future conversation.",
  },
  {
    icon: <BookOpenCheck size={19} />,
    title: "Making a profile clearer",
    company: "Sample product story · Fictional",
    body: "A small team lays out its problem, early validation, open questions, and next milestone in one consistent narrative.",
  },
];
export default function StoriesPage() {
  return (
    <div className="container py-16 sm:py-20">
      <p className="eyebrow">Stories in progress</p>
      <h1 className="display mt-3 max-w-3xl text-5xl leading-tight sm:text-6xl">
        What a better-prepared conversation can look like.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
        The examples below are fictional samples created to illustrate the
        product experience. They are not real customer testimonials, investment
        outcomes, or endorsements.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {examples.map((e, i) => (
          <article key={e.title} className="surface p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef3ff] text-cobalt">
                {e.icon}
              </span>
              <span className="status-demo">FICTIONAL SAMPLE</span>
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[.11em] text-[#7b8596]">
              {e.company}
            </p>
            <h2 className="mt-2 text-lg font-semibold">{e.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{e.body}</p>
            <div className="mt-6 border-t border-line pt-4 text-xs font-medium text-[#828b9a]">
              Illustrative scenario {String(i + 1).padStart(2, "0")}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
