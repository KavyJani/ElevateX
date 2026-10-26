import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import {
  getSession,
  prisma,
  requireApprovedInvestor,
  RequestLike,
  requireDatabase,
} from "../auth/session";
import { forecast, ForecastInput, HistoricalFinancialPeriod } from "./forecast";
import {
  ForecastShareService,
  ShareForecastBody,
} from "./forecast-share.service";

class ForecastBody implements ForecastInput {
  @IsOptional()
  @IsNumber()
  @Min(-1_000_000_000_000)
  @Max(1_000_000_000_000)
  startingCash?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyRevenue?: number;
  @IsNumber() @Min(0) @Max(200) monthlyRevenueGrowthPct!: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyOperatingExpense?: number;
  @IsOptional() @IsNumber() @Min(-1000) @Max(100) grossMarginPct?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(200) expenseGrowthPct?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyCashInflows?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyCashOutflows?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000_000) customerCount?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  averageRevenuePerCustomer?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) monthlyChurnPct?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  monthlyNewCustomers?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyMarketingSpend?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyHiringCosts?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  fundingAssumption?: number;
  @IsOptional() @IsInt() @Min(1) @Max(36) fundingMonth?: number;
  @IsOptional() @IsInt() @Min(6) @Max(36) months?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) downsidePct?: number;
}
@Controller(["forecast", "forecasts"])
export class ForecastController {
  constructor(private readonly shares: ForecastShareService) {}

  @Post()
  async run(@Body() body: ForecastBody, @Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException(
        "Only founders can create startup forecasts",
      );
    const startup = await prisma.startup.findFirst({
      where: { founderId: user.id, isDemo: false },
      select: { id: true },
    });
    if (!startup)
      throw new NotFoundException(
        "Submit a founder startup application before saving a forecast",
      );
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const cutoff = new Date();
    cutoff.setUTCMonth(cutoff.getUTCMonth() - 35);
    const cutoffPeriod = cutoff.toISOString().slice(0, 7);
    const records = await prisma.financialRecord.findMany({
      where: {
        startupId: startup.id,
        period: { gte: cutoffPeriod, lte: currentPeriod },
      },
      orderBy: [{ period: "asc" }, { kind: "asc" }],
      take: 500,
    });
    const historicByPeriod = new Map<string, HistoricalFinancialPeriod>();
    const fieldByKind: Record<
      string,
      keyof Omit<HistoricalFinancialPeriod, "period">
    > = {
      REVENUE: "revenue",
      OPERATING_EXPENSE: "operatingExpense",
      GROSS_PROFIT: "grossProfit",
      NET_PROFIT: "netProfit",
      CASH_BALANCE: "cashBalance",
      CASH_INFLOW: "cashInflows",
      CASH_OUTFLOW: "cashOutflows",
      CUSTOMER_COUNT: "customerCount",
      ARPC: "averageRevenuePerCustomer",
      CHURN: "churnPct",
      HIRING_COSTS: "hiringCosts",
      MARKETING_COSTS: "marketingCosts",
      FUNDING: "funding",
    };
    for (const record of records) {
      const field = fieldByKind[record.kind];
      if (!field) continue;
      const row = historicByPeriod.get(record.period) || {
        period: record.period,
      };
      (row as unknown as Record<string, unknown>)[field] = Number(
        record.amount,
      );
      historicByPeriod.set(record.period, row);
    }
    const history = [...historicByPeriod.values()];
    let computed: ReturnType<typeof forecast>;
    try {
      computed = forecast({ ...body, history });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Invalid assumptions",
      );
    }
    const scenarioData = computed as unknown as Prisma.InputJsonValue;
    const inputData = {
      engine: "ElevateX deterministic scenario engine v2",
      method:
        "Engine v2: owner-entered monthly history where available; scenario revenue/gross-profit/expense/customer/churn and funding assumptions; cash flow incorporates explicitly separate additional inflows/outflows. No valuation is calculated.",
      input: JSON.parse(JSON.stringify({ ...body, history })),
    } as unknown as Prisma.InputJsonValue;
    const base = computed.scenarios.find((entry) => entry.name === "base");
    if (!base)
      throw new BadRequestException(
        "The forecasting engine returned no base scenario",
      );
    const saved = await prisma.$transaction(async (tx) => {
      const scenario = await tx.financialScenario.create({
        data: {
          startupId: startup.id,
          name: `Forecast ${new Date().toISOString()}`,
          engineVersion: 2,
          assumptions: inputData,
          result: scenarioData,
        },
      });
      await tx.financialResult.createMany({
        data: base.months.map((month) => ({
          scenarioId: scenario.id,
          month: month.month,
          revenue: month.revenue,
          expenses: month.operatingExpense,
          cash: month.endingCash,
        })),
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "FORECAST_VERSION_CREATED",
          entityType: "FORECAST_SCENARIO",
          entityId: scenario.id,
          metadata: {
            engineVersion: 2,
            months: body.months || 18,
            historicalPeriods: history.length,
          },
        },
      });
      return scenario;
    });
    return { ...computed, scenarioId: saved.id, savedAt: saved.createdAt };
  }

  @Get("scenarios")
  async ownScenarios(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const items = await prisma.financialScenario.findMany({
      where: { startup: { founderId: user.id, isDemo: false } },
      include: {
        startup: { select: { name: true, slug: true } },
        shares: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        engineVersion: item.engineVersion,
        createdAt: item.createdAt,
        startup: item.startup,
        shares: item.shares.map((share) => ({
          id: share.id,
          user: share.user,
          permission: share.permission,
          createdAt: share.createdAt,
        })),
      })),
    };
  }

  @Get("shared")
  async sharedScenarios(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor")
      throw new ForbiddenException(
        "Investor account is required to view shared scenarios",
      );
    if (!user.investor)
      throw new ForbiddenException("Investor profile is required");
    await requireApprovedInvestor(user.investor.id);
    const items = await prisma.financialShare.findMany({
      where: {
        userId: user.id,
        permission: "READ",
        scenario: { startup: { isDemo: false } },
      },
      include: {
        scenario: {
          include: { startup: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      items: items.map((share) => ({
        id: share.scenario.id,
        name: share.scenario.name,
        engineVersion: share.scenario.engineVersion,
        createdAt: share.scenario.createdAt,
        sharedAt: share.createdAt,
        startup: share.scenario.startup,
      })),
    };
  }

  @Get("scenarios/:id")
  async scenario(@Param("id") id: string, @Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role === "investor") {
      if (!user.investor)
        throw new NotFoundException("Forecast unavailable");
      await requireApprovedInvestor(user.investor.id);
    }
    const item = await prisma.financialScenario.findUnique({
      where: { id },
      include: {
        startup: {
          select: {
            id: true,
            founderId: true,
            name: true,
            slug: true,
            isDemo: true,
          },
        },
      },
    });
    if (!item || item.startup.isDemo)
      throw new NotFoundException("Forecast unavailable");
    const owner = item.startup.founderId === user.id && role === "founder";
    const grant =
      role === "investor"
        ? await prisma.financialShare.findUnique({
            where: { scenarioId_userId: { scenarioId: id, userId: user.id } },
            select: { permission: true },
          })
        : null;
    if (!owner && grant?.permission !== "READ")
      throw new NotFoundException("Forecast unavailable");
    return {
      id: item.id,
      name: item.name,
      engineVersion: item.engineVersion,
      assumptions: item.assumptions,
      result: item.result,
      createdAt: item.createdAt,
      startup: { name: item.startup.name, slug: item.startup.slug },
    };
  }

  @Post("scenarios/:id/share")
  async share(
    @Param("id") id: string,
    @Body() body: ShareForecastBody,
    @Req() request: RequestLike,
  ) {
    return this.shares.grant(id, body, request);
  }

  @Delete("scenarios/:id/share/:userId")
  async revoke(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Req() request: RequestLike,
  ) {
    return this.shares.revoke(id, userId, request);
  }
}
