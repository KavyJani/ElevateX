import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminController } from "./admin/admin.controller";
import { AiController } from "./ai/ai.controller";
import { ApplicationsController } from "./applications.controller";
import { AuthController } from "./auth/auth.controller";
import { CollaborationController } from "./collaboration/collaboration.controller";
import { ContactController } from "./contact/contact.controller";
import { DocumentsController } from "./documents/documents.controller";
import { ForecastController } from "./forecast/forecast.controller";
import { ForecastSharesController } from "./forecast/forecast-shares.controller";
import { ForecastShareService } from "./forecast/forecast-share.service";
import { HealthController } from "./health/health.controller";
import { OnboardingController } from "./onboarding/onboarding.controller";
import { StartupsController } from "./startups/startups.controller";
import {
  UsersController,
  WorkspaceDataController,
} from "./workspace/workspace.controller";

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }])],
  controllers: [
    HealthController,
    OnboardingController,
    AiController,
    AuthController,
    ForecastController,
    ForecastSharesController,
    StartupsController,
    ApplicationsController,
    DocumentsController,
    AdminController,
    CollaborationController,
    ContactController,
    UsersController,
    WorkspaceDataController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ForecastShareService,
  ],
})
export class AppModule {}
