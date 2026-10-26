import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

export const SESSION_COOKIE = "elevatex_session";
export const CSRF_COOKIE = "elevatex_csrf";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const csrfCookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: 60 * 60 * 1000,
};
export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: SESSION_TTL_MS,
};

export interface RequestLike {
  headers: {
    cookie?: string;
    authorization?: string;
    [name: string]: string | string[] | undefined;
  };
  params?: Record<string, string>;
}

export interface ResponseLike {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie(name: string, options: Record<string, unknown>): void;
}

export const prisma = process.env.ELEVATEX_DATABASE_URL
  ? new PrismaClient({
      datasources: {
        db: { url: process.env.ELEVATEX_DATABASE_URL },
      },
    })
  : new PrismaClient();

export function requireDatabase() {
  if (!process.env.ELEVATEX_DATABASE_URL) {
    throw new ServiceUnavailableException({
      error: "PersistenceUnavailable",
      message:
        "Configure ELEVATEX_DATABASE_URL with an external PostgreSQL service. No persistent action was performed.",
    });
  }
}

export function assertInvestorApplicationApproved(
  status: string | null | undefined,
) {
  if (status !== "APPROVED")
    throw new ForbiddenException(
      "Admin approval of the investor application is required for this action",
    );
}

export async function requireApprovedInvestor(investorProfileId: string) {
  requireDatabase();
  const latestApplication = await prisma.investorApplication.findFirst({
    where: { investorId: investorProfileId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  assertInvestorApplicationApproved(latestApplication?.status);
}

export function randomOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readCookie(
  request: RequestLike,
  name: string,
): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const piece of header.split(";")) {
    const index = piece.indexOf("=");
    if (index < 0) continue;
    if (piece.slice(0, index).trim() !== name) continue;
    const value = piece.slice(index + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function csrfMatches(request: RequestLike) {
  const cookie = readCookie(request, CSRF_COOKIE);
  const header = request.headers["x-csrf-token"];
  if (!cookie || typeof header !== "string") return false;
  const left = Buffer.from(cookie);
  const right = Buffer.from(header);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function getSession(request: RequestLike) {
  requireDatabase();
  const raw = readCookie(request, SESSION_COOKIE);
  if (!raw) throw new UnauthorizedException("A valid session is required");
  const session = await prisma.session.findFirst({
    where: { token: hashToken(raw), expiresAt: { gt: new Date() } },
    include: { user: { include: { investor: true, founder: true } } },
  });
  if (!session || !session.user.emailVerified || session.user.disabledAt) {
    throw new UnauthorizedException("A verified account session is required");
  }
  const role =
    session.user.role === "ADMIN"
      ? "admin"
      : session.user.investor
        ? "investor"
        : session.user.founder
          ? "founder"
          : null;
  if (!role)
    throw new UnauthorizedException("No applicant workspace is assigned");
  return { session, user: session.user, role };
}
