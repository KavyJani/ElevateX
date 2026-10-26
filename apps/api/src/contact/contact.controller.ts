import {
  Body,
  Controller,
  ServiceUnavailableException,
  Post,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

class ContactBody {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(10) @MaxLength(3000) message!: string;
}

@Controller("contact")
export class ContactController {
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post()
  async submit(@Body() body: ContactBody) {
    const {
      ELEVATEX_EMAIL_API_URL,
      ELEVATEX_EMAIL_API_KEY,
      ELEVATEX_EMAIL_FROM,
      ELEVATEX_CONTACT_TO,
    } = process.env;
    if (
      !ELEVATEX_EMAIL_API_URL ||
      !ELEVATEX_EMAIL_API_KEY ||
      !ELEVATEX_EMAIL_FROM ||
      !ELEVATEX_CONTACT_TO
    ) {
      throw new ServiceUnavailableException({
        error: "ContactUnavailable",
        message:
          "The contact delivery service is not configured. Your message was not sent.",
      });
    }
    const text = `Contact message from ${body.name.trim()} <${body.email.trim()}>\n\n${body.message.trim()}`;
    try {
      const response = await fetch(ELEVATEX_EMAIL_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ELEVATEX_EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          from: ELEVATEX_EMAIL_FROM,
          to: ELEVATEX_CONTACT_TO,
          subject: "ElevateX website contact",
          text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("provider rejected");
    } catch {
      throw new ServiceUnavailableException({
        error: "ContactDeliveryFailed",
        message:
          "The configured contact provider did not confirm delivery. Your message was not confirmed as sent.",
      });
    }
    return {
      received: true,
      message: "The configured contact provider accepted your message.",
    };
  }
}
