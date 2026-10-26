export type AccountRole = "investor" | "founder" | "admin";

export interface PublicStartup {
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
}

export interface ApiError {
  statusCode?: number;
  error?: string;
  message: string;
}

export function isApplicantRole(
  value: string,
): value is "investor" | "founder" {
  return value === "investor" || value === "founder";
}

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US",
): string {
  if (!Number.isFinite(value))
    throw new RangeError("Currency amount must be finite");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
