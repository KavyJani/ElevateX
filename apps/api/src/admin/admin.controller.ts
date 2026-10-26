import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApplicationStatus, Prisma } from "@prisma/client";
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  getSession,
  prisma,
  RequestLike,
  requireDatabase,
} from "../auth/session";

class ApplicationDecisionBody {
  @IsIn(["investor", "founder"]) role!: "investor" | "founder";
  @IsIn(["approve", "reject", "request_info"]) decision!:
    | "approve"
    | "reject"
    | "request_info";
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
class DocumentReviewBody {
  @IsIn(["approve", "reject"]) decision!: "approve" | "reject";
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
class UserStatusBody {
  @IsBoolean() disabled!: boolean;
  @IsString() @MaxLength(1000) reason!: string;
}
class ListingBody {
  @IsBoolean() publicApproved!: boolean;
  @IsString() @MaxLength(1000) reason!: string;
}

const pageNumber = (value: string | undefined) =>
  Math.max(1, Math.min(10000, Number.parseInt(value || "1", 10) || 1));
const pageSize = (value: string | undefined) =>
  Math.max(1, Math.min(100, Number.parseInt(value || "25", 10) || 25));
const allowedStatuses: ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
  "REJECTED",
];
function applicationAnswers(value: Prisma.JsonValue) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "answers" in value
  ) {
    const answers = (value as Prisma.JsonObject).answers;
    if (answers && typeof answers === "object" && !Array.isArray(answers))
      return answers as Prisma.JsonObject;
  }
  return {} as Prisma.JsonObject;
}

@Controller("admin")
export class AdminController {
  private async administrator(request: RequestLike) {
    const session = await getSession(request);
    if (session.role !== "admin")
      throw new ForbiddenException("Administrator role is required");
    return session.user;
  }

  @Get("overview")
  async overview(@Req() request: RequestLike) {
    await this.administrator(request);
    requireDatabase();
    const [
      users,
      pendingInvestor,
      pendingFounder,
      pendingDocuments,
      approvedStartups,
      recentAudit,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.investorApplication.count({
        where: { status: { in: ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"] } },
      }),
      prisma.founderApplication.count({
        where: { status: { in: ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"] } },
      }),
      prisma.document.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.startup.count({ where: { publicApproved: true, isDemo: false } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
      }),
    ]);
    return {
      counts: {
        users,
        pendingApplications: pendingInvestor + pendingFounder,
        pendingDocuments,
        approvedStartups,
      },
      recentAudit,
    };
  }

  @Get("applications")
  async applications(
    @Req() request: RequestLike,
    @Query("role") roleQuery: string,
    @Query("status") statusQuery: string,
    @Query("page") pageQuery: string,
    @Query("limit") limitQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    if (roleQuery && !["investor", "founder", "all"].includes(roleQuery))
      throw new BadRequestException("Invalid application role filter");
    const status = statusQuery ? (statusQuery as ApplicationStatus) : undefined;
    if (status && !allowedStatuses.includes(status))
      throw new BadRequestException("Invalid application status filter");
    const page = pageNumber(pageQuery),
      limit = pageSize(limitQuery),
      take = Math.min(2000, page * limit);
    const investorWhere = status ? { status } : {};
    const founderWhere = status ? { status } : {};
    const [investorRows, founderRows, investorCount, founderCount] =
      await Promise.all([
        roleQuery === "founder"
          ? Promise.resolve([])
          : prisma.investorApplication.findMany({
              where: investorWhere,
              include: {
                investor: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
              take,
            }),
        roleQuery === "investor"
          ? Promise.resolve([])
          : prisma.founderApplication.findMany({
              where: founderWhere,
              include: {
                founder: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
              take,
            }),
        roleQuery === "founder"
          ? Promise.resolve(0)
          : prisma.investorApplication.count({ where: investorWhere }),
        roleQuery === "investor"
          ? Promise.resolve(0)
          : prisma.founderApplication.count({ where: founderWhere }),
      ]);
    const rows = [
      ...investorRows.map((row) => ({
        id: row.id,
        role: "investor",
        status: row.status,
        reviewNote: row.reviewNote,
        submittedAt: row.submittedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        applicant: row.investor.user,
        data: row.data,
      })),
      ...founderRows.map((row) => ({
        id: row.id,
        role: "founder",
        status: row.status,
        reviewNote: row.reviewNote,
        submittedAt: row.submittedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        applicant: row.founder.user,
        data: row.data,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return {
      applications: rows.slice((page - 1) * limit, page * limit),
      page,
      pageSize: limit,
      total: investorCount + founderCount,
    };
  }

  @Post("applications/:role/:id/decision")
  async decideApplication(
    @Param("role") rolePath: string,
    @Param("id") id: string,
    @Body() body: ApplicationDecisionBody,
    @Req() request: RequestLike,
  ) {
    const admin = await this.administrator(request);
    requireDatabase();
    if (body.role !== rolePath)
      throw new BadRequestException(
        "Application role does not match the route",
      );
    const nextStatus: ApplicationStatus =
      body.decision === "approve"
        ? "APPROVED"
        : body.decision === "reject"
          ? "REJECTED"
          : "NEEDS_INFO";
    const note = body.note?.trim() || null;
    if (body.decision !== "approve" && !note)
      throw new BadRequestException(
        "A reason is required for rejection or information requests",
      );
    const row =
      body.role === "investor"
        ? await prisma.investorApplication.findUnique({
            where: { id },
            include: { investor: { select: { userId: true } } },
          })
        : await prisma.founderApplication.findUnique({
            where: { id },
            include: { founder: { select: { userId: true } } },
          });
    if (!row) throw new NotFoundException("Application unavailable");
    const ownerId =
      body.role === "investor"
        ? (
            row as Awaited<
              ReturnType<typeof prisma.investorApplication.findUnique>
            > & { investor: { userId: string } }
          ).investor.userId
        : (
            row as Awaited<
              ReturnType<typeof prisma.founderApplication.findUnique>
            > & { founder: { userId: string } }
          ).founder.userId;
    if (ownerId === admin.id)
      throw new ForbiddenException(
        "An administrator cannot review their own application",
      );
    if (!["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(row.status))
      throw new BadRequestException(
        "Only submitted applications may be reviewed",
      );
    await prisma.$transaction(async (tx) => {
      if (body.role === "investor")
        await tx.investorApplication.update({
          where: { id },
          data: { status: nextStatus, reviewNote: note },
        });
      else
        await tx.founderApplication.update({
          where: { id },
          data: { status: nextStatus, reviewNote: note },
        });
      await tx.applicationHistory.create({
        data: {
          applicationType: body.role.toUpperCase(),
          applicationId: id,
          fromStatus: row.status,
          toStatus: nextStatus,
          actorId: admin.id,
          note,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: `APPLICATION_${body.decision.toUpperCase()}`,
          entityType: `${body.role.toUpperCase()}_APPLICATION`,
          entityId: id,
          metadata: { previousStatus: row.status, nextStatus, reason: note },
        },
      });
      await tx.notification.create({
        data: {
          userId: ownerId,
          kind: `APPLICATION_${body.decision.toUpperCase()}`,
          payload: {
            applicationId: id,
            status: nextStatus,
            message: note || "Your application was approved.",
          },
        },
      });
    });
    return { reviewed: true, status: nextStatus, note };
  }

  @Get("documents")
  async documents(
    @Req() request: RequestLike,
    @Query("status") statusQuery: string,
    @Query("page") pageQuery: string,
    @Query("limit") limitQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    const status = statusQuery || "PENDING_REVIEW";
    if (
      !["PENDING_REVIEW", "APPROVED", "REJECTED", "UPLOAD_FAILED"].includes(
        status,
      )
    )
      throw new BadRequestException("Invalid document status");
    const page = pageNumber(pageQuery),
      limit = pageSize(limitQuery);
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { status },
        include: { owner: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where: { status } }),
    ]);
    return {
      documents: documents.map(
        ({ storageKey: _secretKey, contentHash: _hash, ...doc }) => doc,
      ),
      page,
      pageSize: limit,
      total,
    };
  }

  @Post("documents/:id/review")
  async reviewDocument(
    @Param("id") id: string,
    @Body() body: DocumentReviewBody,
    @Req() request: RequestLike,
  ) {
    const admin = await this.administrator(request);
    requireDatabase();
    const note = body.note?.trim() || null;
    if (body.decision === "reject" && !note)
      throw new BadRequestException(
        "A reason is required when rejecting a document",
      );
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException("Document unavailable");
    if (document.ownerId === admin.id)
      throw new ForbiddenException(
        "An administrator cannot review their own document",
      );
    if (document.status !== "PENDING_REVIEW")
      throw new BadRequestException("Only pending documents may be reviewed");
    const status = body.decision === "approve" ? "APPROVED" : "REJECTED";
    await prisma.$transaction([
      prisma.document.update({ where: { id }, data: { status } }),
      prisma.verificationReview.create({
        data: {
          subjectType: "DOCUMENT",
          subjectId: id,
          reviewerId: admin.id,
          status,
          note,
        },
      }),
      prisma.documentEvent.create({
        data: { documentId: id, actorId: admin.id, event: `ADMIN_${status}` },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: `DOCUMENT_${status}`,
          entityType: "DOCUMENT",
          entityId: id,
          metadata: { ownerId: document.ownerId, reason: note },
        },
      }),
      prisma.notification.create({
        data: {
          userId: document.ownerId,
          kind: `DOCUMENT_${status}`,
          payload: {
            documentId: id,
            status,
            message: note || "Your document was approved.",
          },
        },
      }),
    ]);
    return { reviewed: true, status, note };
  }

  @Get("users")
  async users(
    @Req() request: RequestLike,
    @Query("q") query: string,
    @Query("page") pageQuery: string,
    @Query("limit") limitQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    const page = pageNumber(pageQuery),
      limit = pageSize(limitQuery),
      q = (query || "").trim().slice(0, 120);
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          disabledAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { users, page, pageSize: limit, total };
  }

  @Patch("users/:id/status")
  async setUserStatus(
    @Param("id") id: string,
    @Body() body: UserStatusBody,
    @Req() request: RequestLike,
  ) {
    const admin = await this.administrator(request);
    requireDatabase();
    const reason = body.reason.trim();
    if (!reason)
      throw new BadRequestException(
        "A reason is required for account suspension changes",
      );
    if (id === admin.id)
      throw new ForbiddenException(
        "An administrator cannot suspend their own active account",
      );
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!target) throw new NotFoundException("User unavailable");
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { disabledAt: body.disabled ? new Date() : null },
      });
      if (body.disabled) await tx.session.deleteMany({ where: { userId: id } });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: body.disabled ? "USER_SUSPENDED" : "USER_REACTIVATED",
          entityType: "USER",
          entityId: id,
          metadata: { reason },
        },
      });
    });
    return { updated: true, disabled: body.disabled };
  }

  @Get("audit-logs")
  async auditLogs(
    @Req() request: RequestLike,
    @Query("page") pageQuery: string,
    @Query("limit") limitQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    const page = pageNumber(pageQuery),
      limit = pageSize(limitQuery);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    return { items, page, pageSize: limit, total };
  }

  @Get("security-events")
  async securityEvents(
    @Req() request: RequestLike,
    @Query("page") pageQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    const page = pageNumber(pageQuery),
      limit = 50;
    const where = { action: { startsWith: "AUTH_" } };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, page, pageSize: limit, total };
  }

  @Get("startups")
  async startups(
    @Req() request: RequestLike,
    @Query("page") pageQuery: string,
  ) {
    await this.administrator(request);
    requireDatabase();
    const page = pageNumber(pageQuery),
      limit = 50;
    const [items, total] = await Promise.all([
      prisma.startup.findMany({
        where: { isDemo: false },
        include: { founder: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.startup.count({ where: { isDemo: false } }),
    ]);
    return { items, page, pageSize: limit, total };
  }

  @Patch("startups/:id/public")
  async publishStartup(
    @Param("id") id: string,
    @Body() body: ListingBody,
    @Req() request: RequestLike,
  ) {
    const admin = await this.administrator(request);
    requireDatabase();
    const reason = body.reason.trim();
    if (!reason)
      throw new BadRequestException(
        "A reason is required for a public listing decision",
      );
    const startup = await prisma.startup.findUnique({ where: { id } });
    if (!startup || startup.isDemo)
      throw new NotFoundException("Applicant startup unavailable");
    if (body.publicApproved) {
      if (!startup.founderId)
        throw new BadRequestException(
          "Startup has no verified founder account",
        );
      const application = await prisma.founderApplication.findFirst({
        where: { founder: { userId: startup.founderId }, status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        select: { data: true },
      });
      const answers = application
        ? applicationAnswers(application.data)
        : ({} as Prisma.JsonObject);
      if (answers.publicProfileConsent !== true)
        throw new ForbiddenException(
          "The founder has not explicitly consented to public listing",
        );
      if (
        typeof answers.publicProfileSummary !== "string" ||
        !answers.publicProfileSummary.trim()
      )
        throw new BadRequestException(
          "A dedicated public profile summary is required; private application answers are never substituted",
        );
    }
    await prisma.$transaction([
      prisma.startup.update({
        where: { id },
        data: { publicApproved: body.publicApproved },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: body.publicApproved
            ? "STARTUP_PUBLISHED"
            : "STARTUP_UNPUBLISHED",
          entityType: "STARTUP",
          entityId: id,
          metadata: { reason },
        },
      }),
    ]);
    return { updated: true, publicApproved: body.publicApproved };
  }
}
