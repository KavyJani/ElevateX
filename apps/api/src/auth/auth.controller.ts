import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import * as argon2 from "argon2";
import {
  CSRF_COOKIE,
  csrfCookieOptions,
  getSession,
  hashToken,
  prisma,
  randomOpaqueToken,
  readCookie,
  RequestLike,
  ResponseLike,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionCookieOptions,
  requireDatabase,
} from "./session";

class RegistrationBody {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
  @IsIn(["investor", "founder"]) role!: "investor" | "founder";
  @IsBoolean() termsAccepted!: boolean;
}

class LoginBody {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}

class EmailBody {
  @IsEmail() @MaxLength(254) email!: string;
}

class TokenBody {
  @IsString() @MinLength(32) @MaxLength(256) token!: string;
}

class PasswordResetBody extends TokenBody {
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}

type EmailSettings = {
  apiUrl: string;
  apiKey: string;
  from: string;
  origin: string;
};

@Controller("auth")
export class AuthController {
  @Get("csrf")
  csrf(@Res({ passthrough: true }) response: ResponseLike) {
    const token = this.issueCsrfCookie(response);
    return { token };
  }

  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post("register")
  async register(@Body() body: RegistrationBody) {
    requireDatabase();
    if (body.termsAccepted !== true) {
      throw new BadRequestException(
        "Explicit agreement to the platform terms is required",
      );
    }
    const email = body.email.trim().toLowerCase();
    if (
      await prisma.user.findUnique({ where: { email }, select: { id: true } })
    ) {
      throw new ConflictException("An account with that email already exists");
    }
    const emailSettings = this.emailSettings();
    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
    });
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash,
        role: "USER",
        investor:
          body.role === "investor"
            ? { create: { data: { legalName: body.name.trim() } } }
            : undefined,
        founder:
          body.role === "founder"
            ? { create: { data: { legalName: body.name.trim() } } }
            : undefined,
      },
    });

    const rawToken = randomOpaqueToken();
    await prisma.emailVerificationToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const verifyUrl = new URL("/verify-email", emailSettings.origin);
    verifyUrl.searchParams.set("token", rawToken);
    try {
      await this.sendEmail(
        emailSettings,
        email,
        "Verify your ElevateX email",
        `Hello ${body.name.trim()},\n\nVerify your email within 24 hours using this one-time link:\n${verifyUrl.toString()}\n\nIf you did not request this, ignore the message. No account will be activated until verification succeeds.`,
      );
    } catch (error) {
      await prisma.user.delete({ where: { id: user.id } });
      throw error;
    }
    await this.recordSecurityEvent("AUTH_REGISTERED", email, user.id);
    return {
      created: true,
      verificationRequired: true,
      message:
        "A verification message was accepted by the configured email provider. Verify your email before signing in.",
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("resend-verification")
  async resendVerification(@Body() body: EmailBody) {
    requireDatabase();
    const emailSettings = this.emailSettings();
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      const rawToken = randomOpaqueToken();
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });
      await prisma.emailVerificationToken.create({
        data: {
          tokenHash: hashToken(rawToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      const verifyUrl = new URL("/verify-email", emailSettings.origin);
      verifyUrl.searchParams.set("token", rawToken);
      await this.sendEmail(
        emailSettings,
        email,
        "Verify your ElevateX email",
        `Use this one-time link within 24 hours to verify your email:\n${verifyUrl.toString()}\n\nIf you did not request this, ignore the message.`,
      );
    }
    return {
      accepted: true,
      message:
        "If verification is pending, an instruction will be sent to that address.",
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("verify-email")
  async verifyEmail(@Body() body: TokenBody) {
    requireDatabase();
    const tokenHash = hashToken(body.token);
    const record = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!record)
      throw new UnauthorizedException(
        "Verification link is invalid or expired",
      );
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      });
      await tx.emailVerificationToken.deleteMany({ where: { id: record.id } });
    });
    await this.recordSecurityEvent("AUTH_EMAIL_VERIFIED", "", record.userId);
    return { verified: true, message: "Email verified. You may now sign in." };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  async login(
    @Body() body: LoginBody,
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    requireDatabase();
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { investor: true, founder: true },
    });
    if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
      await this.recordSecurityEvent("AUTH_LOGIN_FAILED", email, user?.id);
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.disabledAt) {
      await this.recordSecurityEvent("AUTH_LOGIN_BLOCKED", email, user.id);
      throw new ForbiddenException(
        "This account is suspended. Contact support for review.",
      );
    }
    if (!user.emailVerified) {
      throw new ForbiddenException(
        "Verify your email before signing in. If delivery failed, request another verification message.",
      );
    }

    const previous = readCookie(request, SESSION_COOKIE);
    if (previous) {
      await prisma.session.deleteMany({
        where: { token: hashToken(previous) },
      });
    }
    const sessionToken = randomOpaqueToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.create({
      data: { token: hashToken(sessionToken), userId: user.id, expiresAt },
    });
    response.cookie(SESSION_COOKIE, sessionToken, sessionCookieOptions);
    const csrfToken = this.issueCsrfCookie(response);
    await this.recordSecurityEvent("AUTH_LOGIN_SUCCESS", email, user.id);
    return {
      email: user.email,
      role: this.applicationRole(user),
      expiresAt,
      csrfToken,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("password-reset")
  async requestPasswordReset(@Body() body: EmailBody) {
    requireDatabase();
    const emailSettings = this.emailSettings();
    const user = await prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
      select: { id: true, email: true, emailVerified: true },
    });
    if (user?.emailVerified) {
      const rawToken = randomOpaqueToken();
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(rawToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      const resetUrl = new URL(
        "/reset-password/complete",
        emailSettings.origin,
      );
      resetUrl.searchParams.set("token", rawToken);
      await this.sendEmail(
        emailSettings,
        user.email,
        "Reset your ElevateX password",
        `Use this one-time link within 30 minutes to choose a new password:\n${resetUrl.toString()}\n\nIf you did not request this, ignore the message.`,
      );
    }
    await this.recordSecurityEvent(
      "AUTH_PASSWORD_RESET_REQUESTED",
      body.email.trim().toLowerCase(),
      user?.id,
    );
    return {
      accepted: true,
      message:
        "If a verified account exists for this address, password-reset instructions will be sent.",
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("password-reset/complete")
  async completePasswordReset(@Body() body: PasswordResetBody) {
    requireDatabase();
    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashToken(body.token),
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });
    if (!record)
      throw new UnauthorizedException(
        "Password-reset link is invalid or expired",
      );
    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
    });
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tx.session.deleteMany({ where: { userId: record.userId } });
      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      });
    });
    await this.recordSecurityEvent(
      "AUTH_PASSWORD_RESET_COMPLETED",
      "",
      record.userId,
    );
    return {
      completed: true,
      message: "Password updated. Sign in with the new password.",
    };
  }

  @Post("logout")
  async logout(
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    requireDatabase();
    const raw = readCookie(request, SESSION_COOKIE);
    const session = raw
      ? await prisma.session.findFirst({
          where: { token: hashToken(raw) },
          select: { userId: true },
        })
      : null;
    if (raw)
      await prisma.session.deleteMany({ where: { token: hashToken(raw) } });
    if (session)
      await this.recordSecurityEvent("AUTH_LOGOUT", "", session.userId);
    response.clearCookie(SESSION_COOKIE, {
      ...sessionCookieOptions,
      maxAge: undefined,
    });
    response.clearCookie(CSRF_COOKIE, {
      ...csrfCookieOptions,
      maxAge: undefined,
    });
    return { loggedOut: true };
  }

  @Get("me")
  async me(@Req() request: RequestLike) {
    const { user, role, session } = await getSession(request);
    return {
      id: user.id,
      email: user.email,
      role,
      emailVerified: user.emailVerified,
      expiresAt: session.expiresAt,
    };
  }

  private async recordSecurityEvent(
    action: string,
    email: string,
    actorId?: string,
  ) {
    const digest = hashToken(email);
    await prisma.auditLog
      .create({
        data: {
          actorId: actorId || null,
          action,
          entityType: "AUTH",
          entityId: digest.slice(0, 32),
          metadata: { emailHash: digest },
        },
      })
      .catch(() => undefined);
  }

  private emailSettings(): EmailSettings {
    const {
      ELEVATEX_EMAIL_API_URL,
      ELEVATEX_EMAIL_API_KEY,
      ELEVATEX_EMAIL_FROM,
      ELEVATEX_PUBLIC_ORIGIN,
    } = process.env;
    if (
      !ELEVATEX_EMAIL_API_URL ||
      !ELEVATEX_EMAIL_API_KEY ||
      !ELEVATEX_EMAIL_FROM ||
      !ELEVATEX_PUBLIC_ORIGIN
    ) {
      throw new ServiceUnavailableException({
        error: "EmailUnavailable",
        message:
          "Email verification/password reset requires ELEVATEX_EMAIL_API_URL, ELEVATEX_EMAIL_API_KEY, ELEVATEX_EMAIL_FROM, and ELEVATEX_PUBLIC_ORIGIN. No account or email was created.",
      });
    }
    let origin: URL;
    try {
      origin = new URL(ELEVATEX_PUBLIC_ORIGIN);
      if (origin.protocol !== "https:" && origin.hostname !== "localhost")
        throw new Error("HTTPS required");
    } catch {
      throw new ServiceUnavailableException(
        "ELEVATEX_PUBLIC_ORIGIN must be a valid HTTPS origin",
      );
    }
    return {
      apiUrl: ELEVATEX_EMAIL_API_URL,
      apiKey: ELEVATEX_EMAIL_API_KEY,
      from: ELEVATEX_EMAIL_FROM,
      origin: origin.origin,
    };
  }

  private async sendEmail(
    settings: EmailSettings,
    to: string,
    subject: string,
    text: string,
  ) {
    try {
      const response = await fetch(settings.apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({ from: settings.from, to, subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new ServiceUnavailableException({
          error: "EmailDeliveryFailed",
          message:
            "The configured email provider did not accept the message. No verification or reset email was confirmed.",
        });
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({
        error: "EmailUnavailable",
        message:
          "The email provider could not be reached. No verification or reset email was confirmed.",
      });
    }
  }

  private issueCsrfCookie(response: ResponseLike) {
    const token = randomOpaqueToken(24);
    response.cookie(CSRF_COOKIE, token, csrfCookieOptions);
    return token;
  }

  private applicationRole(user: {
    role: "USER" | "ADMIN";
    investor: unknown;
    founder: unknown;
  }) {
    if (user.role === "ADMIN") return "admin";
    if (user.investor) return "investor";
    if (user.founder) return "founder";
    return "founder";
  }
}
