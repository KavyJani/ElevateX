import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { IsInt, IsObject, Max, Min } from "class-validator";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { ONBOARDING_STEPS, type FieldSpec } from "@elevatex/shared/onboarding";
import {
  getSession,
  prisma,
  RequestLike,
  requireDatabase,
} from "./auth/session";

type Role = "investor" | "founder";
type Kind = "investor-applications" | "founder-applications";
type Answers = Record<string, unknown>;
type DraftData = { answers: Answers; completedStep: number };
type Account = Awaited<ReturnType<typeof getSession>>["user"];

class DraftBody {
  @IsInt() @Min(1) @Max(12) step!: number;
  @IsObject() answers!: Answers;
}

function roleForKind(kind: string): Role {
  if (kind === "investor-applications") return "investor";
  if (kind === "founder-applications") return "founder";
  throw new BadRequestException("Application role is invalid");
}

function readDraft(value: Prisma.JsonValue | null | undefined): DraftData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { answers: {}, completedStep: 0 };
  }
  const raw = value as Record<string, Prisma.JsonValue>;
  const answers =
    raw.answers &&
    typeof raw.answers === "object" &&
    !Array.isArray(raw.answers)
      ? (raw.answers as Answers)
      : (raw as Answers);
  const completed = raw.completedStep;
  return {
    answers,
    completedStep:
      typeof completed === "number" && Number.isInteger(completed)
        ? Math.min(12, Math.max(0, completed))
        : 0,
  };
}

function checkAnswersShape(role: Role, answers: Answers) {
  let serialized: string;
  try {
    serialized = JSON.stringify(answers);
  } catch {
    throw new BadRequestException("Application answers must be valid JSON");
  }
  if (serialized.length > 90_000)
    throw new BadRequestException("Draft answers exceed the 90 KB limit");
  const allowed = new Set(
    ONBOARDING_STEPS[role].flatMap((step) =>
      step.fields.map((field) => field.id),
    ),
  );
  for (const [key, value] of Object.entries(answers)) {
    if (!allowed.has(key))
      throw new BadRequestException(`Unknown onboarding field: ${key}`);
    if (typeof value === "string" && value.length > 8_000)
      throw new BadRequestException(`${key} is too long`);
    if (Array.isArray(value) && value.length > 100)
      throw new BadRequestException(`${key} has too many entries`);
  }
}

function isVisible(field: FieldSpec, answers: Answers) {
  if (!field.when) return true;
  const value = answers[field.when.field];
  if (value === undefined || value === null || value === "")
    return field.when.equals === false;
  return String(value) === String(field.when.equals);
}

function requiredError(field: FieldSpec, value: unknown): string | null {
  if (!field.required || field.type === "summary") return null;
  if (field.type === "upload") return null; // Required uploads are checked against the owner-scoped document index below.
  if (field.type === "checkbox" || field.type === "toggle")
    return value === true ? null : `${field.label} must be selected.`;
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
    return `${field.label} is required.`;
  if (
    field.type === "number" &&
    (typeof value !== "number" || !Number.isFinite(value))
  )
    return `${field.label} must be a number.`;
  if (
    (field.type === "text" ||
      field.type === "email" ||
      field.type === "url" ||
      field.type === "tel" ||
      field.type === "textarea" ||
      field.type === "select") &&
    typeof value !== "string"
  )
    return `${field.label} must be text.`;
  if (
    field.type === "multi" &&
    (!Array.isArray(value) ||
      value.some(
        (item) =>
          typeof item !== "string" ||
          (field.options && !field.options.includes(item)),
      ))
  )
    return `${field.label} contains an invalid choice.`;
  if (
    field.type === "select" &&
    field.options &&
    !field.options.includes(String(value))
  )
    return `Choose a valid ${field.label.toLowerCase()}.`;
  if (field.type === "number" && typeof value === "number") {
    if (field.min !== undefined && value < field.min)
      return `${field.label} is below the allowed minimum.`;
    if (field.max !== undefined && value > field.max)
      return `${field.label} is above the allowed maximum.`;
  }
  return null;
}

@Controller()
export class ApplicationsController {
  @Get(":kind/draft")
  async getDraft(
    @Param("kind") kind: string,
    @Query("step") stepQuery: string | undefined,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const role = roleForKind(kind);
    const { user, role: accountRole } = await getSession(request);
    if (accountRole !== role)
      throw new ForbiddenException(
        "This application does not belong to the signed-in role",
      );
    const row =
      role === "investor"
        ? await prisma.investorApplication.findFirst({
            where: {
              investorId: user.investor!.id,
              status: { in: ["DRAFT", "NEEDS_INFO"] },
            },
            orderBy: { updatedAt: "desc" },
          })
        : await prisma.founderApplication.findFirst({
            where: {
              founderId: user.founder!.id,
              status: { in: ["DRAFT", "NEEDS_INFO"] },
            },
            orderBy: { updatedAt: "desc" },
          });
    if (!row) {
      const latest =
        role === "investor"
          ? await prisma.investorApplication.findFirst({
              where: { investorId: user.investor!.id },
              orderBy: { updatedAt: "desc" },
              select: { status: true },
            })
          : await prisma.founderApplication.findFirst({
              where: { founderId: user.founder!.id },
              orderBy: { updatedAt: "desc" },
              select: { status: true },
            });
      if (latest && latest.status !== "REJECTED")
        throw new ForbiddenException({
          error: "ApplicationLocked",
          message:
            "An application is already submitted or under review. It cannot be duplicated or reopened from onboarding.",
        });
    }
    const draft = readDraft(row?.data);
    if (stepQuery !== undefined) {
      const requested = Number(stepQuery);
      if (!Number.isInteger(requested) || requested < 1 || requested > 12)
        throw new BadRequestException("Step must be between 1 and 12");
      if (requested > draft.completedStep + 1)
        throw new ForbiddenException({
          error: "StepLocked",
          message: `Complete step ${draft.completedStep + 1} before opening step ${requested}.`,
          nextStep: draft.completedStep + 1,
        });
    }
    return {
      draft: row,
      answers: draft.answers,
      completedStep: draft.completedStep,
      reviewNote: row?.reviewNote ?? null,
      role,
    };
  }

  @Get(":kind/status")
  async status(@Param("kind") kind: string, @Req() request: RequestLike) {
    requireDatabase();
    const role = roleForKind(kind);
    const { user, role: accountRole } = await getSession(request);
    if (accountRole !== role)
      throw new ForbiddenException(
        "This application does not belong to the signed-in role",
      );
    const row =
      role === "investor"
        ? await prisma.investorApplication.findFirst({
            where: { investorId: user.investor!.id },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              status: true,
              reviewNote: true,
              submittedAt: true,
              updatedAt: true,
            },
          })
        : await prisma.founderApplication.findFirst({
            where: { founderId: user.founder!.id },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              status: true,
              reviewNote: true,
              submittedAt: true,
              updatedAt: true,
            },
          });
    return {
      status: row?.status ?? "NOT_STARTED",
      reviewNote: row?.reviewNote ?? null,
      submittedAt: row?.submittedAt ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  @Put(":kind/draft")
  async saveDraft(
    @Param("kind") kind: string,
    @Body() body: DraftBody,
    @Req() request: RequestLike,
  ) {
    const role = roleForKind(kind);
    const { user, role: accountRole } = await getSession(request);
    if (accountRole !== role)
      throw new ForbiddenException(
        "This application does not belong to the signed-in role",
      );
    return { draft: await this.persistDraft(role, body, user, false) };
  }

  @Post(":kind/complete-step")
  async completeStep(
    @Param("kind") kind: string,
    @Body() body: DraftBody,
    @Req() request: RequestLike,
  ) {
    const role = roleForKind(kind);
    const { user, role: accountRole } = await getSession(request);
    if (accountRole !== role)
      throw new ForbiddenException(
        "This application does not belong to the signed-in role",
      );
    const current = await this.getCurrentDraft(role, user);
    const state = readDraft(current?.data);
    if (body.step > state.completedStep + 1)
      throw new ForbiddenException({
        error: "StepLocked",
        message: `Complete step ${state.completedStep + 1} before continuing.`,
      });
    const merged = this.mergeAnswers(role, state.answers, body.answers);
    const missing = await this.validateStep(role, body.step, merged, user.id);
    if (missing.length)
      throw new BadRequestException({
        error: "StepIncomplete",
        message: "Complete the required fields before continuing.",
        missing,
      });
    const row = await this.persistDraft(
      role,
      { step: body.step, answers: merged },
      user,
      true,
    );
    return { completed: true, completedStep: body.step, draft: row };
  }

  @Post(":kind/submit")
  async submit(
    @Param("kind") kind: string,
    @Body() body: DraftBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const role = roleForKind(kind);
    const { user, role: accountRole } = await getSession(request);
    if (accountRole !== role)
      throw new ForbiddenException(
        "This application does not belong to the signed-in role",
      );
    const row = await this.getCurrentDraft(role, user);
    if (!row) throw new BadRequestException("Save a draft before submitting");
    if (row.status !== "DRAFT" && row.status !== "NEEDS_INFO")
      throw new ConflictException(
        "This application has already been submitted or is under review",
      );
    const state = readDraft(row.data);
    if (body.step !== 12 || state.completedStep < 11)
      throw new ForbiddenException(
        "Complete all prior steps before final submission",
      );
    const answers = this.mergeAnswers(role, state.answers, body.answers);
    const missing: string[] = [];
    for (const step of ONBOARDING_STEPS[role])
      missing.push(
        ...(await this.validateStep(role, step.index, answers, user.id)),
      );
    if (missing.length)
      throw new BadRequestException({
        error: "ApplicationIncomplete",
        message: "Resolve the listed items before submission.",
        missing: [...new Set(missing)],
      });
    const submittedAt = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: "SUBMITTED" as ApplicationStatus,
        submittedAt,
        reviewNote: null,
        data: { answers, completedStep: 12 } as Prisma.InputJsonValue,
      };
      const updated =
        role === "investor"
          ? await tx.investorApplication.update({
              where: { id: row.id },
              data: updateData,
            })
          : await tx.founderApplication.update({
              where: { id: row.id },
              data: updateData,
            });
      if (role === "founder") {
        const name =
          typeof answers.startupName === "string"
            ? answers.startupName.trim()
            : "";
        const slugBase =
          name
            .normalize("NFKD")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48) || "startup";
        const slug = `${slugBase}-${user.id.slice(-6).toLowerCase()}`;
        const publicSummary =
          typeof answers.publicProfileSummary === "string"
            ? answers.publicProfileSummary.trim().slice(0, 900)
            : "";
        const startupData = {
          slug,
          name: name.slice(0, 140),
          tagline:
            typeof answers.tagline === "string"
              ? answers.tagline.slice(0, 160)
              : null,
          industry:
            typeof answers.industry === "string" ? answers.industry : "Other",
          stage:
            typeof answers.developmentStage === "string"
              ? answers.developmentStage
              : "Idea",
          businessModel:
            typeof answers.businessModel === "string"
              ? answers.businessModel
              : null,
          description: publicSummary || null,
          location:
            typeof answers.headquarters === "string"
              ? answers.headquarters.slice(0, 120)
              : null,
          publicApproved: false,
          isDemo: false,
          founderId: user.id,
        };
        const existing = await tx.startup.findFirst({
          where: { founderId: user.id, isDemo: false },
          select: { id: true },
        });
        if (existing)
          await tx.startup.update({
            where: { id: existing.id },
            data: startupData,
          });
        else await tx.startup.create({ data: startupData });
      }
      await tx.applicationHistory.create({
        data: {
          applicationType: role.toUpperCase(),
          applicationId: row.id,
          fromStatus: row.status,
          toStatus: "SUBMITTED",
          actorId: user.id,
          note: "Applicant submitted after server-side validation",
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "APPLICATION_SUBMITTED",
          entityType: `${role.toUpperCase()}_APPLICATION`,
          entityId: row.id,
        },
      });
      return updated;
    });
    return {
      submitted: true,
      applicationId: result.id,
      status: result.status,
      submittedAt,
    };
  }

  private async persistDraft(
    role: Role,
    body: DraftBody,
    user: Account,
    completed: boolean,
  ) {
    requireDatabase();
    const prior = await this.getCurrentDraft(role, user);
    if (prior && prior.status !== "DRAFT" && prior.status !== "NEEDS_INFO")
      throw new ConflictException(
        "Submitted applications cannot be overwritten",
      );
    const state = readDraft(prior?.data);
    const answers = this.mergeAnswers(role, state.answers, body.answers);
    const completedStep = completed
      ? Math.max(state.completedStep, body.step)
      : body.step <= state.completedStep
        ? Math.max(0, body.step - 1)
        : state.completedStep;
    const data = { answers, completedStep } as unknown as Prisma.InputJsonValue;
    if (role === "investor") {
      return prior
        ? prisma.investorApplication.update({
            where: { id: prior.id },
            data: { data },
          })
        : prisma.investorApplication.create({
            data: { investorId: user.investor!.id, status: "DRAFT", data },
          });
    }
    return prior
      ? prisma.founderApplication.update({
          where: { id: prior.id },
          data: { data },
        })
      : prisma.founderApplication.create({
          data: { founderId: user.founder!.id, status: "DRAFT", data },
        });
  }

  private mergeAnswers(
    role: Role,
    existing: Answers,
    incoming: Answers,
  ): Answers {
    checkAnswersShape(role, incoming);
    const merged = { ...existing, ...incoming };
    checkAnswersShape(role, merged);
    return merged;
  }

  private async getCurrentDraft(role: Role, account: Account) {
    if (role === "investor") {
      if (!account.investor)
        throw new ForbiddenException("Investor profile required");
      return prisma.investorApplication.findFirst({
        where: {
          investorId: account.investor.id,
          status: { in: ["DRAFT", "NEEDS_INFO"] },
        },
        orderBy: { updatedAt: "desc" },
      });
    }
    if (!account.founder)
      throw new ForbiddenException("Founder profile required");
    return prisma.founderApplication.findFirst({
      where: {
        founderId: account.founder.id,
        status: { in: ["DRAFT", "NEEDS_INFO"] },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  private async validateStep(
    role: Role,
    stepNumber: number,
    answers: Answers,
    userId: string,
  ) {
    const step = ONBOARDING_STEPS[role].find(
      (candidate) => candidate.index === stepNumber,
    );
    if (!step) throw new BadRequestException("Step is invalid");
    const missing: string[] = [];
    for (const field of step.fields) {
      if (!isVisible(field, answers)) continue;
      const issue = requiredError(field, answers[field.id]);
      if (issue) missing.push(issue);
      if (field.required && field.type === "upload") {
        const document = await prisma.document.findFirst({
          where: {
            ownerId: userId,
            documentType: field.id,
            status: { notIn: ["REJECTED", "DELETED"] },
          },
          select: { id: true },
        });
        if (!document)
          missing.push(
            `${field.label} must be uploaded through private storage before continuing.`,
          );
      }
    }
    return missing;
  }
}
