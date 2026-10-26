export type StartupCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  businessModel: string;
  summary: string;
  isDemo: boolean;
};

export const DEMO_STARTUPS: StartupCardData[] = [
  {
    id: "demo-1",
    slug: "noria-grid",
    name: "Noria Grid",
    tagline: "Helping buildings use energy with more intention.",
    industry: "Climate & Energy",
    stage: "Prototype",
    location: "Austin, US",
    businessModel: "B2B SaaS",
    summary:
      "A fictional early-stage team exploring a clearer way to surface building energy patterns for operators.",
    isDemo: true,
  },
  {
    id: "demo-2",
    slug: "fieldnote-market",
    name: "Fieldnote Market",
    tagline: "A simpler handoff from local growers to kitchens.",
    industry: "Food & Agriculture",
    stage: "Idea",
    location: "Toronto, Canada",
    businessModel: "Marketplace",
    summary:
      "An illustrative concept for coordinating small-producer availability with independent food businesses.",
    isDemo: true,
  },
  {
    id: "demo-3",
    slug: "northstar-learning",
    name: "Northstar Learning",
    tagline: "Skills practice that fits around real work.",
    industry: "Education",
    stage: "MVP",
    location: "London, UK",
    businessModel: "B2B SaaS",
    summary:
      "A fictional sample profile showing how an early product might describe its audience and learning loop.",
    isDemo: true,
  },
];
