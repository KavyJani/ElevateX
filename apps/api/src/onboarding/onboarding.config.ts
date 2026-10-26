import { ONBOARDING_STEPS } from "@elevatex/shared/onboarding";

export const ONBOARDING = {
  investor: ONBOARDING_STEPS.investor.map((step) => ({
    id: `investor-${step.index}`,
    title: step.title,
    explanation: step.intro,
    fields: step.fields,
    guide: {
      meaning: step.help.meaning,
      reason: step.help.reason,
      enterOrUpload: step.help.enter,
      example: step.help.example,
      mistakes: step.help.mistakes,
      suggestedFollowUp: step.help.question,
    },
  })),
  founder: ONBOARDING_STEPS.founder.map((step) => ({
    id: `founder-${step.index}`,
    title: step.title,
    explanation: step.intro,
    fields: step.fields,
    guide: {
      meaning: step.help.meaning,
      reason: step.help.reason,
      enterOrUpload: step.help.enter,
      example: step.help.example,
      mistakes: step.help.mistakes,
      suggestedFollowUp: step.help.question,
    },
  })),
};
