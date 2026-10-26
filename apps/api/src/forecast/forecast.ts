export interface HistoricalFinancialPeriod {
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
}

export interface ForecastInput {
  startingCash?: number;
  monthlyRevenue?: number;
  monthlyRevenueGrowthPct: number;
  monthlyOperatingExpense?: number;
  grossMarginPct?: number;
  expenseGrowthPct?: number;
  monthlyCashInflows?: number;
  monthlyCashOutflows?: number;
  customerCount?: number;
  averageRevenuePerCustomer?: number;
  monthlyChurnPct?: number;
  monthlyNewCustomers?: number;
  monthlyMarketingSpend?: number;
  monthlyHiringCosts?: number;
  fundingAssumption?: number;
  fundingMonth?: number;
  months?: number;
  downsidePct?: number;
  history?: HistoricalFinancialPeriod[];
}

const rounded = (value: number) => Number(value.toFixed(2));
const finiteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function forecast(input: ForecastInput) {
  for (const [key, value] of Object.entries(input)) {
    if (key === "history" || value === undefined) continue;
    const signed = key === "startingCash" || key === "grossMarginPct";
    const percentage = [
      "monthlyRevenueGrowthPct",
      "expenseGrowthPct",
      "grossMarginPct",
      "monthlyChurnPct",
      "downsidePct",
    ].includes(key);
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (signed
        ? Math.abs(value) > 1_000_000_000_000
        : value < 0 || (!percentage && value > 1_000_000_000_000))
    )
      throw new Error(`${key} must be a finite non-negative number`);
  }
  if (input.monthlyRevenueGrowthPct > 200)
    throw new Error("monthlyRevenueGrowthPct cannot exceed 200% per month");
  if ((input.expenseGrowthPct ?? 0) > 200)
    throw new Error("expenseGrowthPct cannot exceed 200% per month");
  if ((input.grossMarginPct ?? 0) > 100 || (input.grossMarginPct ?? 0) < -1000)
    throw new Error("grossMarginPct must be between -1000% and 100%");
  if ((input.monthlyChurnPct ?? 0) > 100)
    throw new Error("monthlyChurnPct cannot exceed 100%");
  if ((input.downsidePct ?? 0) > 100)
    throw new Error("downsidePct cannot exceed 100%");
  if (input.months !== undefined && !Number.isInteger(input.months))
    throw new Error("months must be a whole number");

  const history = [...(input.history ?? [])].sort((a, b) =>
    a.period.localeCompare(b.period),
  );
  const seenPeriods = new Set<string>();
  for (const row of history) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(row.period))
      throw new Error("Historical periods must use YYYY-MM format");
    if (seenPeriods.has(row.period))
      throw new Error(`Historical period ${row.period} is duplicated`);
    seenPeriods.add(row.period);
    for (const [key, value] of Object.entries(row)) {
      if (key === "period" || value === undefined) continue;
      const signed = ["grossProfit", "netProfit", "cashBalance"].includes(key);
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        (signed ? Math.abs(value) > 1_000_000_000_000 : value < 0)
      )
        throw new Error(`Historical ${key} is outside the permitted range`);
    }
    if ((row.churnPct ?? 0) > 100)
      throw new Error(`Historical churn for ${row.period} cannot exceed 100%`);
  }
  if (history.length > 36)
    throw new Error("At most 36 historical months can be modeled");

  const latest = history.at(-1);
  const startingCash = input.startingCash ?? latest?.cashBalance;
  const recordedRevenue = input.monthlyRevenue ?? latest?.revenue;
  const derivedExpense =
    latest?.grossProfit !== undefined && latest.netProfit !== undefined
      ? latest.grossProfit - latest.netProfit
      : undefined;
  const baseOperatingExpense =
    input.monthlyOperatingExpense ?? latest?.operatingExpense ?? derivedExpense;
  const grossMarginPct =
    input.grossMarginPct ??
    (latest?.grossProfit !== undefined && latest.revenue && latest.revenue > 0
      ? (latest.grossProfit / latest.revenue) * 100
      : undefined);
  if (startingCash === undefined)
    throw new Error("Enter starting cash or record a historical cash balance");
  if (recordedRevenue === undefined)
    throw new Error("Enter current revenue or record historical revenue");
  if (baseOperatingExpense === undefined)
    throw new Error(
      "Enter current operating expense or record historical operating expense",
    );
  if (
    !finiteNonNegative(baseOperatingExpense) ||
    baseOperatingExpense > 1_000_000_000_000
  )
    throw new Error("Base operating expense must be finite and non-negative");
  if (grossMarginPct === undefined)
    throw new Error(
      "Enter gross margin or record both historical gross profit and revenue",
    );
  if (
    !Number.isFinite(grossMarginPct) ||
    grossMarginPct < -1000 ||
    grossMarginPct > 100
  )
    throw new Error("Gross margin must be between -1000% and 100%");

  const months = Math.min(36, Math.max(6, Math.floor(input.months ?? 18)));
  if (input.fundingMonth !== undefined && input.fundingMonth > months)
    throw new Error("The funding month must fall within the forecast horizon");
  const customerCount = input.customerCount ?? latest?.customerCount;
  const arpc =
    input.averageRevenuePerCustomer ?? latest?.averageRevenuePerCustomer;
  const customerModel = customerCount !== undefined && arpc !== undefined;
  const initialRevenue = customerModel ? customerCount * arpc : recordedRevenue;
  const churnPct = input.monthlyChurnPct ?? latest?.churnPct ?? 0;
  const monthlyCashInflows =
    input.monthlyCashInflows ?? latest?.cashInflows ?? 0;
  const monthlyCashOutflows =
    input.monthlyCashOutflows ?? latest?.cashOutflows ?? 0;
  const marketingSpend =
    input.monthlyMarketingSpend ?? latest?.marketingCosts ?? 0;
  const hiringCosts = input.monthlyHiringCosts ?? latest?.hiringCosts ?? 0;
  const monthlyNewCustomers = input.monthlyNewCustomers ?? 0;
  const expenseGrowthPct = input.expenseGrowthPct ?? 0;
  const downsidePct = input.downsidePct ?? 0;
  const names = ["conservative", "base", "optimistic"] as const;
  const factors = { conservative: 0.5, base: 1, optimistic: 1.5 } as const;

  const project = (name: (typeof names)[number], initialRevenueFactor = 1) => {
    const factor = factors[name];
    let revenue = initialRevenue * initialRevenueFactor;
    let customers = customerCount;
    let averageRevenue =
      arpc === undefined ? undefined : arpc * initialRevenueFactor;
    let cash = startingCash;
    let firstBreakEven: number | null = null;
    let firstNegative: number | null = null;
    const rows = [];
    for (let month = 1; month <= months; month++) {
      if (
        customerModel &&
        customers !== undefined &&
        averageRevenue !== undefined
      ) {
        customers = Math.max(
          0,
          customers * (1 - churnPct / 100) + monthlyNewCustomers,
        );
        averageRevenue *= 1 + (input.monthlyRevenueGrowthPct * factor) / 100;
        revenue = customers * averageRevenue;
      } else {
        revenue *= 1 + (input.monthlyRevenueGrowthPct * factor) / 100;
      }
      const operatingExpense =
        (baseOperatingExpense + marketingSpend + hiringCosts) *
        Math.pow(1 + expenseGrowthPct / 100, month);
      const grossProfit = revenue * (grossMarginPct / 100);
      const profitLoss = grossProfit - operatingExpense;
      const funding =
        input.fundingAssumption && month === (input.fundingMonth ?? 1)
          ? input.fundingAssumption
          : 0;
      const cashFlow =
        profitLoss + monthlyCashInflows + funding - monthlyCashOutflows;
      cash += cashFlow;
      if (profitLoss >= 0 && firstBreakEven === null) firstBreakEven = month;
      if (cash < 0 && firstNegative === null) firstNegative = month;
      rows.push({
        month,
        revenue: rounded(revenue),
        grossProfit: rounded(grossProfit),
        operatingExpense: rounded(operatingExpense),
        hiringCosts: rounded(
          hiringCosts * Math.pow(1 + expenseGrowthPct / 100, month),
        ),
        marketingCosts: rounded(
          marketingSpend * Math.pow(1 + expenseGrowthPct / 100, month),
        ),
        profitLoss: rounded(profitLoss),
        cashInflows: rounded(monthlyCashInflows),
        cashOutflows: rounded(monthlyCashOutflows),
        funding: rounded(funding),
        cashFlow: rounded(cashFlow),
        monthlyBurn: rounded(
          Math.max(0, -(profitLoss + monthlyCashInflows - monthlyCashOutflows)),
        ),
        endingCash: rounded(cash),
        customerCount: customers === undefined ? null : rounded(customers),
        averageRevenuePerCustomer:
          averageRevenue === undefined ? null : rounded(averageRevenue),
      });
    }
    const last = rows.at(-1)!;
    const currentMonthlyBurn = Math.max(
      0,
      baseOperatingExpense +
        marketingSpend +
        hiringCosts -
        initialRevenue * (grossMarginPct / 100) -
        monthlyCashInflows +
        monthlyCashOutflows,
    );
    return {
      name,
      assumptions: {
        monthlyRevenueOrArpcGrowthPct: input.monthlyRevenueGrowthPct * factor,
        monthlyExpenseGrowthPct: expenseGrowthPct,
        grossMarginPct,
        monthlyChurnPct: churnPct,
        monthlyNewCustomers,
        customerModel,
        fundingAssumption: input.fundingAssumption ?? 0,
        fundingMonth: input.fundingMonth ?? 1,
      },
      months: rows,
      breakEvenMonth: firstBreakEven,
      endingCash: last.endingCash,
      monthlyBurn: rounded(currentMonthlyBurn),
      runwayMonths: firstNegative,
    };
  };

  const scenarios = names.map((name) => project(name));
  const base = scenarios.find((entry) => entry.name === "base")!;
  const stressed = project("base", 1 - downsidePct / 100);
  return {
    engineVersion: 2,
    assumptionDriven: history.length === 0,
    historicalSource:
      history.length === 0
        ? "No historical periods supplied; all starting figures are user assumptions."
        : "Owner-entered historical records; periods remain distinct from projections.",
    historical: history,
    disclaimer:
      "Illustrative scenarios from owner-entered historical records and user assumptions; not a prediction, valuation, or investment advice.",
    scenarios,
    downside: {
      revenueReductionPct: downsidePct,
      description:
        "Downside sensitivity reduces the starting revenue/ARPC base before monthly compounding; it is not a probability or forecast.",
      baseEndingCash: base.endingCash,
      downsideEndingCash: stressed.endingCash,
      baseRunwayMonth: base.runwayMonths,
      downsideRunwayMonth: stressed.runwayMonths,
    },
  };
}
