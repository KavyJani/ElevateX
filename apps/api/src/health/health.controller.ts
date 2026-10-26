import { Controller, Get } from "@nestjs/common";
@Controller("health")
export class HealthController {
  @Get() health() {
    return {
      status: "ok",
      service: "elevatex-api",
      persistence: process.env.ELEVATEX_DATABASE_URL
        ? "configured"
        : "unavailable",
      database:
        "external PostgreSQL via ELEVATEX_DATABASE_URL; platform MySQL is not used",
    };
  }
}
