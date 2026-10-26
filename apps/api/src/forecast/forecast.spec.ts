import { forecast } from "./forecast";

describe("deterministic forecasting", () => {
  it("returns three assumption-driven scenarios", () => {
    const result = forecast({
      startingCash: 1000,
      monthlyRevenue: 200,
      monthlyRevenueGrowthPct: 5,
      monthlyOperatingExpense: 500,
      grossMarginPct: 100,
      months: 12,
    });
    expect(result.scenarios.map((scenario) => scenario.name)).toEqual([
      "conservative",
      "base",
      "optimistic",
    ]);
    expect(result.scenarios[1].months).toHaveLength(12);
    expect(result.assumptionDriven).toBe(true);
  });

  it("uses owner-entered history, gross margin, customer economics and cash drivers", () => {
    const result = forecast({
      startingCash: 10_000,
      monthlyRevenue: 1000,
      monthlyRevenueGrowthPct: 10,
      monthlyOperatingExpense: 500,
      grossMarginPct: 50,
      customerCount: 10,
      averageRevenuePerCustomer: 100,
      monthlyChurnPct: 10,
      monthlyNewCustomers: 2,
      monthlyMarketingSpend: 100,
      monthlyHiringCosts: 50,
      monthlyCashInflows: 20,
      monthlyCashOutflows: 10,
      fundingAssumption: 300,
      fundingMonth: 2,
      months: 6,
      downsidePct: 20,
      history: [
        {
          period: "2026-09",
          revenue: 1000,
          operatingExpense: 500,
          grossProfit: 500,
          netProfit: -150,
          cashBalance: 10_000,
          customerCount: 10,
          averageRevenuePerCustomer: 100,
        },
      ],
    });
    const base = result.scenarios.find((scenario) => scenario.name === "base")!;
    expect(result.engineVersion).toBe(2);
    expect(result.assumptionDriven).toBe(false);
    expect(result.historical).toHaveLength(1);
    expect(base.months[0]).toMatchObject({
      revenue: 1210,
      grossProfit: 605,
      operatingExpense: 650,
      profitLoss: -45,
      cashInflows: 20,
      cashOutflows: 10,
      funding: 0,
      monthlyBurn: 35,
      customerCount: 11,
      averageRevenuePerCustomer: 110,
    });
    expect(base.months[1].funding).toBe(300);
    expect(result.downside?.downsideEndingCash).toBeLessThan(
      result.downside?.baseEndingCash ?? 0,
    );
  });

  it("rejects negative revenue assumptions but allows historic losses", () => {
    expect(() =>
      forecast({
        startingCash: -1,
        monthlyRevenue: -1,
        monthlyRevenueGrowthPct: 0,
        monthlyOperatingExpense: 0,
        grossMarginPct: 100,
      }),
    ).toThrow();
    expect(() =>
      forecast({
        startingCash: -100,
        monthlyRevenue: 100,
        monthlyRevenueGrowthPct: 0,
        monthlyOperatingExpense: 150,
        grossMarginPct: 50,
        history: [
          {
            period: "2026-09",
            revenue: 100,
            grossProfit: 50,
            netProfit: -100,
            cashBalance: -100,
          },
        ],
      }),
    ).not.toThrow();
  });
});
