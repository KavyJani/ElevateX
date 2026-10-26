import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  getSession,
  prisma,
  RequestLike,
  requireDatabase,
} from "../auth/session";
import { ONBOARDING } from "../onboarding/onboarding.config";

class ChatBody {
  @IsString() @MinLength(1) @MaxLength(2000) message!: string;
  @IsOptional() @IsIn(["investor", "founder"]) role?: "investor" | "founder";
  @IsOptional() @IsString() @MaxLength(40) step?: string;
  @IsOptional() @IsString() @MaxLength(8000) context?: string;
  @IsOptional() @IsBoolean() forecastConsent?: boolean;
  @IsOptional() @IsString() @MaxLength(40) conversationId?: string;
}
type CompletionResponse = {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
};

@Controller("ai")
export class AiController {
  @Get("onboarding-help/:role/:step")
  help(@Param("role") role: string, @Param("step") step: string) {
    if (role !== "investor" && role !== "founder")
      throw new BadRequestException("Invalid onboarding role");
    const config = ONBOARDING[role].find(
      (entry) => entry.id === step || entry.id === `${role}-${step}`,
    );
    if (!config) throw new BadRequestException("Invalid onboarding step");
    return { role, step: config.id, guide: config.guide };
  }

  @Get("conversations")
  async conversations(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role === "admin")
      throw new ForbiddenException(
        "INVESTO chat is available to investor and founder accounts",
      );
    const items = await prisma.aiConversation.findMany({
      where: { userId: user.id, role },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        role: item.role,
        updatedAt: item.updatedAt,
        preview: item.messages[0]?.content.slice(0, 120) || "New conversation",
      })),
    };
  }

  @Get("conversations/:id")
  async conversation(@Param("id") id: string, @Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    const item = await prisma.aiConversation.findFirst({
      where: { id, userId: user.id, role },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
    });
    if (!item) throw new NotFoundException("Conversation unavailable");
    return {
      id: item.id,
      role: item.role,
      messages: item.messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.content,
        createdAt: message.createdAt,
      })),
    };
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("chat")
  async chat(@Body() body: ChatBody, @Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor" && role !== "founder")
      throw new ForbiddenException(
        "INVESTO chat is available to investor and founder accounts",
      );
    if (body.role && body.role !== role)
      throw new ForbiddenException(
        "INVESTO context must match the authenticated account role",
      );
    if (
      body.context?.startsWith("Computed forecast context:") &&
      body.forecastConsent !== true
    )
      throw new ForbiddenException(
        "Explicit consent is required before forecast values are sent to INVESTO",
      );
    return this.answer(body, user.id, role);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("investo")
  async investo(@Body() body: ChatBody, @Req() request: RequestLike) {
    return this.chat(body, request);
  }

  private async answer(
    body: ChatBody,
    userId: string,
    role: "investor" | "founder",
  ) {
    const question = body.message.trim();
    const stepId = body.step ?? `${role}-1`;
    const step = ONBOARDING[role].find(
      (entry) => entry.id === stepId || entry.id === `${role}-${stepId}`,
    );
    if (!step) throw new BadRequestException("Invalid onboarding step");

    let conversationId = body.conversationId;
    if (conversationId) {
      const owned = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId, role },
        select: { id: true },
      });
      if (!owned) throw new NotFoundException("Conversation unavailable");
    } else {
      const created = await prisma.aiConversation.create({
        data: { userId, role },
        select: { id: true },
      });
      conversationId = created.id;
    }
    await prisma.aiMessage.create({
      data: { conversationId, role: "user", content: question },
    });
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const baseUrl = process.env.MANUS_API_URL;
    const apiKey = process.env.MANUS_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException({
        error: "AIUnavailable",
        conversationId,
        message:
          "INVESTO is unavailable because the configured AI service is missing. Your question is saved in your private history; static step guidance remains available.",
      });
    }
    const forecastExplanation = body.context?.startsWith(
      "Computed forecast context:",
    );
    const system = [
      "You are INVESTO, a neutral guide to startup discovery, onboarding and financial terminology.",
      `The authenticated user's role is ${role}.`,
      ...(forecastExplanation
        ? [
            "The active request is an explanation of a deterministic scenario already computed by the application. Use only the supplied result and scenario context, explain formulas, assumptions, uncertainty and risks, and do not recalculate, invent or infer values absent from that context.",
          ]
        : [
            `The current onboarding step is ${step.title}.`,
            step.guide.meaning,
            step.guide.reason,
            step.guide.enterOrUpload,
            step.guide.example,
            step.guide.mistakes,
          ]),
      "Answer the question in this step context. Do not invent company facts or financial outputs, offer personalized investment/legal/tax advice, guarantee returns, or approve/reject applicants.",
      "Forecast figures must come from the deterministic application engine. Explain uncertainty and assumptions.",
      "Do not request bank passwords, PINs, or unnecessary sensitive personal data.",
    ].join(" ");
    const context = body.context?.trim();
    const userContent = context
      ? `User-authorized context: ${context}\n\nQuestion: ${question}`
      : question;
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12_000);
    try {
      const response = await fetch(
        `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: system },
              { role: "user", content: userContent },
            ],
          }),
          signal: abort.signal,
        },
      );
      const result = (await response
        .json()
        .catch(() => ({}))) as CompletionResponse;
      if (!response.ok || result.error)
        throw new ServiceUnavailableException({
          error: "AIProviderError",
          conversationId,
          message:
            "The configured AI service did not complete this request. Your question is saved privately; retry later.",
        });
      const answer = result.choices?.[0]?.message?.content?.trim();
      if (!answer || answer.length > 8000)
        throw new ServiceUnavailableException({
          error: "AIInvalidResponse",
          conversationId,
          message:
            "The AI service returned no usable response. Your question is saved privately; no answer was fabricated.",
        });
      await prisma.aiMessage.create({
        data: { conversationId, role: "assistant", content: answer },
      });
      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return { conversationId, answer };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({
        error: "AIUnavailable",
        conversationId,
        message:
          "The AI request timed out or the service could not be reached. Your question is saved privately; static guidance remains available.",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
