import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { IsEmail, MaxLength } from "class-validator";
import {
  getSession,
  prisma,
  requireApprovedInvestor,
  RequestLike,
  requireDatabase,
} from "../auth/session";

export class ShareForecastBody {
  @IsEmail() @MaxLength(254) email!: string;
}

@Injectable()
export class ForecastShareService {
  async grant(
    scenarioId: string,
    body: ShareForecastBody,
    request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const scenario = await prisma.financialScenario.findFirst({
      where: { id: scenarioId, startup: { founderId: user.id, isDemo: false } },
      include: { startup: { select: { id: true, name: true } } },
    });
    if (!scenario) throw new NotFoundException("Forecast unavailable");
    const recipient = await prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        disabledAt: true,
        investor: { select: { id: true } },
      },
    });
    if (
      !recipient ||
      !recipient.investor ||
      !recipient.emailVerified ||
      recipient.disabledAt
    )
      throw new NotFoundException(
        "An active email-verified investor account was not found",
      );
    await requireApprovedInvestor(recipient.investor.id);
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: user.id, recipientId: recipient.id },
          { requesterId: recipient.id, recipientId: user.id },
        ],
      },
      select: { id: true },
    });
    if (!connection)
      throw new ForbiddenException(
        "Forecast sharing requires an accepted founder–investor connection",
      );
    const share = await prisma.$transaction(async (tx) => {
      const grant = await tx.financialShare.upsert({
        where: {
          scenarioId_userId: { scenarioId, userId: recipient.id },
        },
        create: { scenarioId, userId: recipient.id, permission: "READ" },
        update: { permission: "READ" },
      });
      await tx.notification.create({
        data: {
          userId: recipient.id,
          kind: "FORECAST_SHARED",
          payload: { scenarioId, startupName: scenario.startup.name },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "FORECAST_SHARED",
          entityType: "FORECAST_SCENARIO",
          entityId: scenarioId,
          metadata: { recipientId: recipient.id },
        },
      });
      return grant;
    });
    return {
      shared: true,
      share: {
        id: share.id,
        email: recipient.email,
        name: recipient.name,
        permission: share.permission,
        createdAt: share.createdAt,
      },
    };
  }

  async revoke(scenarioId: string, userId: string, request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const owned = await prisma.financialScenario.findFirst({
      where: {
        id: scenarioId,
        startup: { founderId: user.id, isDemo: false },
      },
      select: { id: true },
    });
    if (!owned) throw new NotFoundException("Forecast unavailable");
    const [deleted] = await prisma.$transaction([
      prisma.financialShare.deleteMany({ where: { scenarioId, userId } }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "FORECAST_SHARE_REVOKED",
          entityType: "FORECAST_SCENARIO",
          entityId: scenarioId,
          metadata: { recipientId: userId },
        },
      }),
    ]);
    return { revoked: deleted.count > 0 };
  }
}
