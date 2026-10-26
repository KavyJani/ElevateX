"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { csrfHeaders } from "@/lib/csrf";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Share2,
  Trash2,
} from "lucide-react";

type Input = {
  startingCash: number | "";
  monthlyRevenue: number | "";
  monthlyRevenueGrowthPct: number | "";
  monthlyOperatingExpense: number | "";
  grossMarginPct: number | "";
  expenseGrowthPct: number | "";
  monthlyCashInflows: number | "";
  monthlyCashOutflows: number | "";
  customerCount: number | "";
  averageRevenuePerCustomer: number | "";
  monthlyChurnPct: number | "";
  monthlyNewCustomers: number | "";
  monthlyMarketingSpend: number | "";
  monthlyHiringCosts: number | "";
  fundingAssumption: number | "";
  fundingMonth: number | "";
  months: number;
  downsidePct: number | "";
};
type Row = {
  month: number;
  revenue: number;
  grossProfit: number;
  operatingExpense: number;
  profitLoss: number;
  cashInflows: number;
  cashOutflows: number;
  funding: number;
  cashFlow: number;
  monthlyBurn: number;
  endingCash: number;
  customerCount: number | null;
  averageRevenuePerCustomer: number | null;
};
type HistoricalPeriod = {
  period: string;
  revenue?: number;
  operatingExpense?: number;
  grossProfit?: number;
  netProfit?: number;
  cashBalance?: number;
  cashInflows?: number;
  cashOutflows?: number;
  customerCount?: number;
  averageRevenuePerCustomer?: number;
  churnPct?: number;
  hiringCosts?: number;
  marketingCosts?: number;
  funding?: number;
};
type Scenario = {
  name: "conservative" | "base" | "optimistic";
  assumptions: Record<string, number | boolean>;
  months: Row[];
  breakEvenMonth: number | null;
  endingCash: number;
  monthlyBurn: number;
  runwayMonths: number | null;
};
type Result = {
  assumptionDriven: boolean;
  disclaimer: string;
  scenarios: Scenario[];
  historical: HistoricalPeriod[];
  historicalSource: string;
  engineVersion: number;
  downside?: {
    revenueReductionPct: number;
    description: string;
    baseEndingCash: number;
    downsideEndingCash: number;
    baseRunwayMonth: number | null;
    downsideRunwayMonth: number | null;
  };
  scenarioId?: string;
  savedAt?: string;
};
type AccountRole = "founder" | "investor";
type ScenarioIndex = {
  id: string;
  name: string;
  createdAt: string;
  sharedAt?: string;
  startup?: { name: string; slug: string };
  shares?: Array<{
    id: string;
    user: { id: string; name: string; email: string };
    permission: string;
  }>;
};
const blank: Input = {
  startingCash: "",
  monthlyRevenue: "",
  monthlyRevenueGrowthPct: "",
  monthlyOperatingExpense: "",
  grossMarginPct: "",
  expenseGrowthPct: "",
  monthlyCashInflows: "",
  monthlyCashOutflows: "",
  customerCount: "",
  averageRevenuePerCustomer: "",
  monthlyChurnPct: "",
  monthlyNewCustomers: "",
  monthlyMarketingSpend: "",
  monthlyHiringCosts: "",
  fundingAssumption: "",
  fundingMonth: "",
  months: 18,
  downsidePct: 20,
};
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;
export default function ForecastsPage() {
  const [input, setInput] = useState<Input>(blank);
  const [result, setResult] = useState<Result | null>(null);
  const [scenario, setScenario] = useState<Scenario["name"]>("base");
  const [chart, setChart] = useState<"revenue" | "profit" | "cash" | "burn">(
    "revenue",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [owned, setOwned] = useState<ScenarioIndex[]>([]);
  const [shared, setShared] = useState<ScenarioIndex[]>([]);
  const [shareEmail, setShareEmail] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const chosen = result?.scenarios.find((s) => s.name === scenario);
  const rows = chosen?.months || [];
  const data = useMemo(
    () =>
      rows.map((r) => ({
        month: `M${r.month}`,
        Revenue: r.revenue,
        "Gross profit": r.grossProfit,
        "Operating expense": r.operatingExpense,
        "Profit / loss": r.profitLoss,
        "Cash balance": r.endingCash,
        "Cash flow": r.cashFlow,
        "Net monthly burn": r.monthlyBurn,
        "Customer count": r.customerCount ?? 0,
      })),
    [rows],
  );
  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && (data?.role === "founder" || data?.role === "investor"))
          setAccountRole(data.role);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!accountRole) return;
    let active = true;
    const path =
      accountRole === "founder"
        ? "/api/v1/forecast/scenarios"
        : "/api/v1/forecast/shared";
    fetch(path, { credentials: "include", cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.items)) return;
        accountRole === "founder"
          ? setOwned(data.items)
          : setShared(data.items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accountRole, result?.scenarioId]);
  async function loadScenario(id: string) {
    setBusy(true);
    setError("");
    setNote("");
    setAiConsent(false);
    try {
      const r = await fetch(`/api/v1/forecast/scenarios/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const d = await r.json().catch(() => ({}));
      if (
        !r.ok ||
        !Array.isArray(d.result?.scenarios) ||
        d.result.scenarios.length !== 3
      )
        throw new Error(
          d.message || "This forecast is no longer available to this account.",
        );
      setResult({ ...d.result, scenarioId: d.id });
      setScenario("base");
      setNote(
        "Loaded an explicitly authorized saved version; its original assumptions were not modified.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the saved forecast.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function shareCurrent(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.scenarioId || !shareEmail.trim()) return;
    setShareBusy(true);
    setError("");
    setNote("");
    try {
      const csrf = await csrfHeaders();
      const r = await fetch(
        `/api/v1/forecast/scenarios/${result.scenarioId}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrf },
          body: JSON.stringify({ email: shareEmail.trim() }),
        },
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(d.message || "This forecast could not be shared.");
      setNote(
        `Forecast explicitly shared with ${d.share?.email || shareEmail.trim()}.`,
      );
      setShareEmail("");
      const list = await fetch("/api/v1/forecast/scenarios", {
        credentials: "include",
        cache: "no-store",
      }).then((x) => x.json());
      if (Array.isArray(list.items)) setOwned(list.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast sharing failed.");
    } finally {
      setShareBusy(false);
    }
  }
  async function revokeShare(id: string, userId: string) {
    try {
      const csrf = await csrfHeaders();
      const r = await fetch(
        `/api/v1/forecast/scenarios/${id}/share/${userId}`,
        { method: "DELETE", credentials: "include", headers: csrf },
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "Access could not be revoked.");
      const list = await fetch("/api/v1/forecast/scenarios", {
        credentials: "include",
        cache: "no-store",
      }).then((x) => x.json());
      if (Array.isArray(list.items)) setOwned(list.items);
      setNote(
        d.revoked
          ? "Investor access was revoked."
          : "No active share grant was found.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share revocation failed.");
    }
  }
  function setNum(key: keyof Input, value: string) {
    setInput((old) => ({ ...old, [key]: value === "" ? "" : Number(value) }));
    setNote("");
  }
  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    if (accountRole !== "founder") {
      setError(
        "Only signed-in founders can create and save startup forecasts.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    setAiConsent(false);
    const payload = {
      startingCash: input.startingCash === "" ? undefined : input.startingCash,
      monthlyRevenue:
        input.monthlyRevenue === "" ? undefined : input.monthlyRevenue,
      monthlyRevenueGrowthPct: input.monthlyRevenueGrowthPct,
      monthlyOperatingExpense:
        input.monthlyOperatingExpense === ""
          ? undefined
          : input.monthlyOperatingExpense,
      grossMarginPct:
        input.grossMarginPct === "" ? undefined : input.grossMarginPct,
      expenseGrowthPct:
        input.expenseGrowthPct === "" ? undefined : input.expenseGrowthPct,
      monthlyCashInflows:
        input.monthlyCashInflows === "" ? undefined : input.monthlyCashInflows,
      monthlyCashOutflows:
        input.monthlyCashOutflows === ""
          ? undefined
          : input.monthlyCashOutflows,
      customerCount:
        input.customerCount === "" ? undefined : input.customerCount,
      averageRevenuePerCustomer:
        input.averageRevenuePerCustomer === ""
          ? undefined
          : input.averageRevenuePerCustomer,
      monthlyChurnPct:
        input.monthlyChurnPct === "" ? undefined : input.monthlyChurnPct,
      monthlyNewCustomers:
        input.monthlyNewCustomers === ""
          ? undefined
          : input.monthlyNewCustomers,
      monthlyMarketingSpend:
        input.monthlyMarketingSpend === ""
          ? undefined
          : input.monthlyMarketingSpend,
      monthlyHiringCosts:
        input.monthlyHiringCosts === "" ? undefined : input.monthlyHiringCosts,
      fundingAssumption:
        input.fundingAssumption === "" ? undefined : input.fundingAssumption,
      fundingMonth: input.fundingMonth === "" ? undefined : input.fundingMonth,
      months: input.months,
      downsidePct: input.downsidePct === "" ? undefined : input.downsidePct,
    };
    try {
      const csrf = await csrfHeaders();
      const r = await fetch("/api/v1/forecast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(
          d.message ||
            `Forecast service could not calculate this scenario (${r.status}).`,
        );
      if (!Array.isArray(d.scenarios) || d.scenarios.length !== 3)
        throw new Error(
          "The forecasting engine returned an incomplete result; no graph was updated.",
        );
      setResult(d);
      setScenario("base");
      setNote(
        `Recalculated and saved as a private version${d.scenarioId ? ` (${d.scenarioId.slice(0, 10)}…)` : ""}. This is illustrative, not a prediction.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Forecast API unavailable. No scenario was generated.",
      );
    } finally {
      setBusy(false);
    }
  }
  const activeValue =
    chart === "revenue"
      ? "Revenue"
      : chart === "profit"
        ? "Profit / loss"
        : chart === "burn"
          ? "Net monthly burn"
          : "Cash balance";
  function explainWithInvesto() {
    if (!result || !chosen || !accountRole || !aiConsent) return;
    const computedResult = {
      engineVersion: result.engineVersion,
      scenario: chosen.name,
      assumptions: chosen.assumptions,
      endingCash: chosen.endingCash,
      firstModeledNegativeCashMonth: chosen.runwayMonths,
      breakEvenMonth: chosen.breakEvenMonth,
      monthlyPeriods: chosen.months.map((row) => ({
        month: row.month,
        revenue: row.revenue,
        grossProfit: row.grossProfit,
        operatingExpense: row.operatingExpense,
        profitLoss: row.profitLoss,
        cashInflows: row.cashInflows,
        cashOutflows: row.cashOutflows,
        funding: row.funding,
        cashFlow: row.cashFlow,
        netMonthlyBurn: row.monthlyBurn,
        endingCash: row.endingCash,
      })),
      downside: result.downside,
      disclaimer: result.disclaimer,
    };
    const context = `Computed forecast context: ${JSON.stringify(computedResult)}`;
    if (context.length > 7900) {
      setError(
        "This scenario is too large to share with INVESTO in one request. Choose a shorter forecast horizon and recalculate.",
      );
      return;
    }
    const question = `Explain the computed ${chosen.name} scenario, its actual formulas and assumptions, the monthly changes in cash and net burn, break-even/runway, and the downside comparison. Only use the results included in the context; identify what is uncertain or not modeled.`;
    try {
      sessionStorage.setItem(
        "elevatex:pending-forecast",
        JSON.stringify({ role: accountRole, question, context }),
      );
      setAiConsent(false);
      window.location.assign("/investo?context=forecast");
    } catch {
      setError(
        "The private result handoff could not be prepared in this browser. No forecast was sent.",
      );
    }
  }
  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">Financial scenarios</p>
        <h1 className="display mt-3 text-[45px] leading-[1.02] sm:text-[58px]">
          See the assumptions move.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Enter your inputs to calculate conservative, base, and optimistic
          scenarios. These deterministic scenarios illustrate assumptions; they
          do not predict performance or establish value.
        </p>
      </div>
      {authLoading ? (
        <p role="status" className="mt-6 text-sm text-muted">
          Checking account access…
        </p>
      ) : !accountRole ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-5 text-sm text-muted">
          Sign in with a verified founder account to create private forecasts,
          or an investor account to view scenarios explicitly shared with you.{" "}
          <Link href="/sign-in" className="font-semibold text-cobalt underline">
            Sign in
          </Link>
        </div>
      ) : null}
      {accountRole === "founder" && owned.length > 0 && (
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">Private saved versions</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {owned.map((item) => (
              <div key={item.id} className="rounded-lg border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => void loadScenario(item.id)}
                    className="rounded-md bg-[#eef3ff] px-2.5 py-1.5 text-[10px] font-semibold text-cobalt"
                  >
                    View
                  </button>
                </div>
                {item.shares?.map((share) => (
                  <div
                    key={share.id}
                    className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-[10px]"
                  >
                    <span>
                      {share.user.email} · {share.permission}
                    </span>
                    <button
                      onClick={() => void revokeShare(item.id, share.user.id)}
                      aria-label={`Revoke ${share.user.email} access`}
                      className="text-[#94423c] hover:underline"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
      {accountRole === "investor" && (
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">
            Forecasts explicitly shared with you
          </h2>
          {shared.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {shared.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line p-3"
                >
                  <div>
                    <p className="text-xs font-semibold">
                      {item.startup?.name || "Startup"} · {item.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      Shared{" "}
                      {new Date(
                        item.sharedAt || item.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => void loadScenario(item.id)}
                    className="rounded-md bg-[#eef3ff] px-2.5 py-1.5 text-[10px] font-semibold text-cobalt"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              No founder has explicitly shared a forecast with this account.
            </p>
          )}
        </section>
      )}
      <div className="mt-8 grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        {accountRole === "founder" ? (
          <form
            onSubmit={calculate}
            className="rounded-xl border border-line bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ChartNoAxesColumnIncreasing size={17} className="text-cobalt" />{" "}
              Your assumptions
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Blank starting values may be supplied by your latest owner-entered
              monthly records. Optional cash-flow, customer and funding drivers
              remain distinct; no missing value is silently shown as actual.
            </p>
            <div className="mt-5 grid gap-3">
              <label className="field text-xs">
                Starting cash balance (USD; blank uses latest history)
                <input
                  type="number"
                  min="-1000000000000"
                  step="any"
                  value={input.startingCash}
                  onChange={(e) => setNum("startingCash", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Current monthly revenue (USD; blank uses latest history)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyRevenue}
                  onChange={(e) => setNum("monthlyRevenue", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Monthly revenue growth (or ARPC growth) assumption (%)
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="any"
                  required
                  value={input.monthlyRevenueGrowthPct}
                  onChange={(e) =>
                    setNum("monthlyRevenueGrowthPct", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Base monthly operating expenses (excluding separately recorded
                hiring/marketing; blank uses history)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyOperatingExpense}
                  onChange={(e) =>
                    setNum("monthlyOperatingExpense", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Gross margin assumption (%; blank derives from history)
                <input
                  type="number"
                  min="-1000"
                  max="100"
                  step="any"
                  value={input.grossMarginPct}
                  onChange={(e) => setNum("grossMarginPct", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Current paying customer count
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={input.customerCount}
                  onChange={(e) => setNum("customerCount", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Average revenue per customer (monthly)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.averageRevenuePerCustomer}
                  onChange={(e) =>
                    setNum("averageRevenuePerCustomer", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Monthly customer churn assumption (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={input.monthlyChurnPct}
                  onChange={(e) => setNum("monthlyChurnPct", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                New customers per month assumption
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyNewCustomers}
                  onChange={(e) =>
                    setNum("monthlyNewCustomers", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Monthly marketing spend (USD)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyMarketingSpend}
                  onChange={(e) =>
                    setNum("monthlyMarketingSpend", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Monthly hiring costs (USD)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyHiringCosts}
                  onChange={(e) => setNum("monthlyHiringCosts", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Additional monthly cash inflows (excludes revenue/funding)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyCashInflows}
                  onChange={(e) => setNum("monthlyCashInflows", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Additional monthly cash outflows (excludes operating costs)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.monthlyCashOutflows}
                  onChange={(e) =>
                    setNum("monthlyCashOutflows", e.target.value)
                  }
                />
              </label>
              <label className="field text-xs">
                Hypothetical funding assumption (USD)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={input.fundingAssumption}
                  onChange={(e) => setNum("fundingAssumption", e.target.value)}
                />
              </label>
              <label className="field text-xs">
                Funding month (within selected horizon)
                <input
                  type="number"
                  min="1"
                  max={input.months}
                  step="1"
                  value={input.fundingMonth}
                  onChange={(e) => setNum("fundingMonth", e.target.value)}
                  placeholder="1"
                />
                <small>Blank applies funding in month 1.</small>
              </label>
              <label className="field text-xs">
                Monthly expense growth assumption (%)
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="any"
                  value={input.expenseGrowthPct}
                  onChange={(e) => setNum("expenseGrowthPct", e.target.value)}
                />
                <small>Defaults to 0% only when explicitly left blank.</small>
              </label>
              <label className="field text-xs">
                Forecast horizon (months)
                <select
                  value={input.months}
                  onChange={(e) =>
                    setInput((old) => ({
                      ...old,
                      months: Number(e.target.value),
                    }))
                  }
                  className="h-[44px] rounded-lg border border-line bg-white px-3 text-sm"
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={18}>18 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </label>
              <label className="field text-xs">
                Downside revenue sensitivity (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={input.downsidePct}
                  onChange={(e) => setNum("downsidePct", e.target.value)}
                />
              </label>
            </div>
            <button
              disabled={busy}
              className="btn btn-primary mt-5 w-full disabled:opacity-50"
            >
              {busy ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />{" "}
                  Calculating…
                </>
              ) : (
                <>
                  <RefreshCw size={15} /> Recalculate scenarios
                </>
              )}
            </button>
            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-[#efd9d8] bg-[#fff7f6] p-3 text-xs leading-5 text-[#94423c]"
              >
                {error}
              </div>
            )}
            {note && (
              <div
                role="status"
                className="mt-3 rounded-lg border border-[#dce8dd] bg-[#f4faf4] p-3 text-xs leading-5 text-[#42654b]"
              >
                {note}
              </div>
            )}
            <div className="mt-5 rounded-lg bg-[#fbf8ef] p-3 text-[11px] leading-5 text-[#766b47]">
              <ShieldAlert size={14} className="mr-1 inline" />
              Revenue growth is not the same as valuation. No valuation multiple
              is assumed or displayed.
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
            {accountRole === "investor"
              ? "Investors can view only scenarios a founder has explicitly shared with this account. Select an authorized scenario above."
              : "Sign in with a verified founder account to create a private scenario."}
          </div>
        )}
        <div className="grid gap-4">
          {!result ? (
            <div className="grid min-h-[340px] place-items-center rounded-xl border border-dashed border-[#d7deea] bg-white p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#eef3ff] text-cobalt">
                  <ChartNoAxesColumnIncreasing size={20} />
                </span>
                <h2 className="mt-4 text-base font-semibold">
                  Your scenario chart will appear here
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">
                  Add your assumptions and calculate. No example financial
                  results are preloaded.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-[#768195]">
                      Assumption-driven projection
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      Scenario view
                    </h2>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Choose scenario"
                  >
                    {result.scenarios.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => {
                          setScenario(s.name);
                          setAiConsent(false);
                        }}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ${scenario === s.name ? "bg-cobalt text-white" : "border border-line bg-white text-[#5f6b7e]"}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-5 flex flex-wrap gap-2 border-b border-line pb-3"
                  role="tablist"
                  aria-label="Forecast chart type"
                >
                  {(
                    [
                      ["revenue", "Revenue"],
                      ["profit", "Profit & loss"],
                      ["cash", "Cash flow / cash balance"],
                      ["burn", "Cash burn"],
                    ] as const
                  ).map(([id, text]) => (
                    <button
                      role="tab"
                      aria-selected={chart === id}
                      key={id}
                      onClick={() => setChart(id)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold ${chart === id ? "bg-[#eef3ff] text-cobalt" : "text-[#728095] hover:bg-canvas"}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <div className="mt-4 h-[290px] w-full sm:h-[340px]">
                  {chart === "profit" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data}
                        margin={{ top: 10, right: 16, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis
                          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip formatter={(v) => fmt(Number(v))} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Revenue"
                          stroke="#2457d6"
                          strokeWidth={2.4}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Gross profit"
                          stroke="#7c6ac7"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Operating expense"
                          stroke="#c69c50"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Profit / loss"
                          stroke="#4a8c69"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : chart === "cash" ? (
                    <AreaChartWrap data={data} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data}
                        margin={{ top: 10, right: 16, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis
                          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip formatter={(v) => fmt(Number(v))} />
                        <Area
                          type="monotone"
                          dataKey={activeValue}
                          stroke="#2457d6"
                          fill="#eaf0ff"
                          strokeWidth={2.4}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[#8290a3]">
                  Stored historical periods are listed separately below; chart
                  months are projections from the latest recorded/entered base.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    title="Month 1 net cash burn · excludes funding"
                    value={fmt(chosen!.months[0]!.monthlyBurn)}
                  />
                  <Metric
                    title="Projected period-end cash"
                    value={fmt(chosen!.endingCash)}
                  />
                  <Metric
                    title="First break-even month"
                    value={
                      chosen!.breakEvenMonth === null
                        ? "Not reached"
                        : "Month " + chosen!.breakEvenMonth
                    }
                  />
                  <Metric
                    title="Cash turns negative"
                    value={
                      chosen!.runwayMonths === null
                        ? "Not within horizon"
                        : "Month " + chosen!.runwayMonths
                    }
                  />
                </div>
                <section className="mt-5 rounded-lg border border-line bg-[#fbfcfe] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xs font-semibold">
                      Historical records · not projections
                    </h3>
                    <span className="text-[10px] text-muted">
                      {result.historical?.length || 0} owner-entered periods ·
                      USD unless count / %
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-5 text-muted">
                    {result.historicalSource ||
                      "This older saved version has no historical-period snapshot."}
                  </p>
                  {result.historical?.length ? (
                    <div className="mt-3 max-h-[250px] overflow-auto rounded border border-line">
                      <table className="w-full min-w-[1180px] text-left text-[10px]">
                        <thead className="sticky top-0 bg-[#f4f6fa]">
                          <tr>
                            {[
                              "Period",
                              "Revenue",
                              "Operating expense",
                              "Gross profit",
                              "Net profit / loss",
                              "Cash balance",
                              "Cash in",
                              "Cash out",
                              "Customers",
                              "ARPC",
                              "Churn %",
                              "Hiring",
                              "Marketing",
                              "Funding",
                            ].map((label) => (
                              <th key={label} className="p-2 font-semibold">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.historical.map((row) => (
                            <tr
                              key={row.period}
                              className="border-t border-line"
                            >
                              {[
                                row.period,
                                row.revenue,
                                row.operatingExpense,
                                row.grossProfit,
                                row.netProfit,
                                row.cashBalance,
                                row.cashInflows,
                                row.cashOutflows,
                                row.customerCount,
                                row.averageRevenuePerCustomer,
                                row.churnPct,
                                row.hiringCosts,
                                row.marketingCosts,
                                row.funding,
                              ].map((value, index) => (
                                <td
                                  key={`${row.period}-${index}`}
                                  className="p-2 tabular-nums"
                                >
                                  {typeof value === "number"
                                    ? value.toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                      })
                                    : (value ?? "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-[10px] leading-5 text-muted">
                      No historical rows were stored with this version. It is an
                      assumption-only scenario.
                    </p>
                  )}
                </section>
                <div className="mt-5 rounded-lg border border-line bg-[#fbfcfe] p-4 text-xs leading-5 text-[#5e6a7d]">
                  <p className="font-semibold text-ink">
                    Method and uncertainty
                  </p>
                  <p className="mt-1">
                    Gross profit = projected revenue × entered/derived gross
                    margin; profit/loss = gross profit − base operating costs −
                    separately modeled marketing and hiring. If customer count
                    and ARPC are supplied, revenue uses customers after churn
                    and new-customer assumptions × growing ARPC. Cash flow = net
                    profit/loss + additional cash inflows + the dated
                    hypothetical funding assumption − additional cash outflows.
                    Taxes, debt schedules, working capital and collection timing
                    remain unmodeled.
                  </p>
                  <p className="mt-1">{result.disclaimer}</p>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-white p-5">
                <h3 className="text-sm font-semibold">Downside sensitivity</h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  The API applies the entered percentage decrease to starting
                  revenue/ARPC and returns a separate calculated ending-cash and
                  runway comparison. This is not a probability-weighted
                  forecast.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#fbf8ef] px-3 py-2 text-xs font-semibold text-[#766b47]">
                  <CircleHelp size={14} />
                  {result.downside
                    ? `${pct(result.downside.revenueReductionPct)} revenue reduction · ${result.downside.description}`
                    : "No sensitivity input supplied"}
                </div>
                {result.downside && (
                  <p className="mt-3 text-xs text-muted">
                    Base ending cash: {fmt(result.downside.baseEndingCash)} ·
                    Downside ending cash:{" "}
                    {fmt(result.downside.downsideEndingCash)} · Negative cash
                    first occurs:{" "}
                    {result.downside.downsideRunwayMonth === null
                      ? "not within horizon"
                      : `month ${result.downside.downsideRunwayMonth}`}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#e8e4d5] bg-[#fbf9f2] p-4 text-xs leading-5 text-[#756b49]">
                {result.scenarioId ? (
                  <>
                    Saved as a private, versioned scenario on{" "}
                    {result.savedAt
                      ? new Date(result.savedAt).toLocaleString()
                      : "the configured database"}
                    . It is visible only to its founder until explicitly shared
                    with a connected investor.
                  </>
                ) : (
                  "This result is not identified as a saved version."
                )}{" "}
                Valuation scenarios require a defensible method and documented
                inputs; no industry multiples are invented.
              </div>
              {accountRole === "founder" && result.scenarioId && (
                <form
                  onSubmit={shareCurrent}
                  className="rounded-xl border border-line bg-white p-5"
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Share2 size={15} className="text-cobalt" />
                    Share this version
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Enter the verified email of an investor already connected
                    with you. Sharing this scenario does not share documents or
                    other forecasts.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="email"
                      required
                      maxLength={254}
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="connected investor email"
                      className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-xs"
                    />
                    <button
                      disabled={shareBusy}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {shareBusy ? "Sharing…" : "Share"}
                    </button>
                  </div>
                </form>
              )}
              {accountRole && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <h3 className="text-sm font-semibold">
                    Explain this selected result with INVESTO
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    INVESTO can explain the displayed deterministic output and
                    its assumptions. It will not modify this forecast. Nothing
                    is sent until you explicitly consent below; if sent, the
                    configured AI provider will process these selected
                    projections and assumptions. Historical financial rows and
                    other private records are not included.
                  </p>
                  <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#5e6a7d]">
                    <input
                      type="checkbox"
                      checked={aiConsent}
                      onChange={(event) => setAiConsent(event.target.checked)}
                      className="mt-1 accent-[#2457d6]"
                    />
                    I authorize sending the selected scenario assumptions and
                    computed monthly results to INVESTO for this explanation.
                  </label>
                  <button
                    type="button"
                    disabled={!aiConsent}
                    onClick={explainWithInvesto}
                    className="btn btn-secondary mt-3 disabled:opacity-50"
                  >
                    Explain with INVESTO
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function AreaChartWrap({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 16, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
          tick={{ fontSize: 10 }}
        />
        <Tooltip formatter={(v) => fmt(Number(v))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="Cash flow"
          stroke="#7b8ca7"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Cash balance"
          stroke="#2457d6"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-[10px] font-semibold text-[#778296]">{title}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
