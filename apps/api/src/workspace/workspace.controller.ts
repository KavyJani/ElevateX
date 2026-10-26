import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  getSession,
  prisma,
  RequestLike,
  requireDatabase,
} from "../auth/session";

class SettingsBody {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
}
class FinancialRecordBody {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period!: string;
  @IsIn([
    "REVENUE",
    "OPERATING_EXPENSE",
    "GROSS_PROFIT",
    "NET_PROFIT",
    "CASH_BALANCE",
    "CASH_INFLOW",
    "CASH_OUTFLOW",
    "CUSTOMER_COUNT",
    "ARPC",
    "CHURN",
    "HIRING_COSTS",
    "MARKETING_COSTS",
    "FUNDING",
  ])
  kind!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) amount!: number;
  @IsOptional() @Matches(/^[A-Z]{3}$/) currency?: string;
}

@Controller("users")
export class UsersController {
  @Get("overview")
  async overview(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    const [unreadNotifications, application] = await Promise.all([
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      role === "investor" && user.investor
        ? prisma.investorApplication.findFirst({
            where: { investorId: user.investor.id },
            orderBy: { updatedAt: "desc" },
            select: { status: true, reviewNote: true },
          })
        : role === "founder" && user.founder
          ? prisma.founderApplication.findFirst({
              where: { founderId: user.founder.id },
              orderBy: { updatedAt: "desc" },
              select: { status: true, reviewNote: true },
            })
          : Promise.resolve(null),
    ]);
    return {
      role,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      application: application || { status: "NOT_STARTED", reviewNote: null },
      unreadNotifications,
    };
  }

  @Get("settings")
  async settings(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      emailVerified: user.emailVerified,
    };
  }

  @Patch("settings")
  async updateSettings(
    @Body() body: SettingsBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const name = body.name.trim();
    if (name.length < 2)
      throw new ForbiddenException("A valid display name is required");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: { id: true, name: true, email: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_PROFILE_UPDATED",
        entityType: "USER",
        entityId: user.id,
      },
    });
    return { updated: true, user: updated };
  }
}

@Controller()
export class WorkspaceDataController {
  @Get("startups/mine")
  async mine(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const [startup, application] = await Promise.all([
      prisma.startup.findFirst({
        where: { founderId: user.id, isDemo: false },
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          industry: true,
          stage: true,
          businessModel: true,
          description: true,
          location: true,
          publicApproved: true,
          updatedAt: true,
        },
      }),
      prisma.founderProfile.findUnique({
        where: { userId: user.id },
        include: {
          applications: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { status: true, reviewNote: true, submittedAt: true },
          },
        },
      }),
    ]);
    return {
      startup,
      application: application?.applications[0] || {
        status: "NOT_STARTED",
        reviewNote: null,
        submittedAt: null,
      },
    };
  }

  @Get("financial-records")
  async financialRecords(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const startup = await prisma.startup.findFirst({
      where: { founderId: user.id, isDemo: false },
      select: { id: true },
    });
    if (!startup)
      return {
        items: [],
        message:
          "Create and submit a startup application before adding private financial records.",
      };
    const records = await prisma.financialRecord.findMany({
      where: { startupId: startup.id },
      orderBy: [{ period: "asc" }, { kind: "asc" }],
    });
    return {
      items: records.map((record) => ({
        ...record,
        amount: record.amount.toString(),
      })),
    };
  }

  @Post("financial-records")
  async saveFinancialRecord(
    @Body() body: FinancialRecordBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    if (body.period > new Date().toISOString().slice(0, 7))
      throw new BadRequestException(
        "Historical financial records cannot be in a future period",
      );
    if (
      !Number.isFinite(body.amount) ||
      Math.abs(body.amount) > 1_000_000_000_000
    )
      throw new BadRequestException(
        "Financial record amount is outside the permitted range",
      );
    if (
      !["GROSS_PROFIT", "NET_PROFIT", "CASH_BALANCE"].includes(body.kind) &&
      body.amount < 0
    )
      throw new BadRequestException(
        "This financial record category cannot be negative",
      );
    if (body.kind === "CUSTOMER_COUNT" && !Number.isInteger(body.amount))
      throw new BadRequestException("Customer count must be a whole number");
    if (body.kind === "CHURN" && body.amount > 100)
      throw new BadRequestException("Monthly churn must be between 0 and 100%");
    const startup = await prisma.startup.findFirst({
      where: { founderId: user.id, isDemo: false },
      select: { id: true },
    });
    if (!startup)
      throw new NotFoundException(
        "A founder startup is required before saving private financial records",
      );
    const currency = (body.currency || "USD").toUpperCase();
    if (currency !== "USD")
      throw new BadRequestException(
        "Financial history and forecast assumptions currently use USD; convert source values before entry",
      );
    const existingCurrency = await prisma.financialRecord.findFirst({
      where: { startupId: startup.id },
      select: { currency: true },
    });
    if (existingCurrency && existingCurrency.currency !== currency)
      throw new BadRequestException(
        "All private historical records for a startup must use one currency",
      );
    const amount = body.amount.toFixed(2);
    const record = await prisma.financialRecord.upsert({
      where: {
        startupId_period_kind: {
          startupId: startup.id,
          period: body.period,
          kind: body.kind,
        },
      },
      create: {
        startupId: startup.id,
        period: body.period,
        kind: body.kind,
        amount,
        currency,
      },
      update: { amount, currency },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "FINANCIAL_RECORD_UPDATED",
        entityType: "STARTUP",
        entityId: startup.id,
        metadata: {
          period: body.period,
          kind: body.kind,
          currency: body.currency || "USD",
        },
      },
    });
    return {
      saved: true,
      record: { ...record, amount: record.amount.toString() },
    };
  }
}
