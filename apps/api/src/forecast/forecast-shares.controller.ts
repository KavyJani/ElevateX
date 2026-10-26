import { Body, Controller, Delete, Param, Post, Req } from "@nestjs/common";
import { RequestLike } from "../auth/session";
import {
  ForecastShareService,
  ShareForecastBody,
} from "./forecast-share.service";

@Controller("forecast-shares")
export class ForecastSharesController {
  constructor(private readonly shares: ForecastShareService) {}

  @Post(":scenarioId")
  grant(
    @Param("scenarioId") scenarioId: string,
    @Body() body: ShareForecastBody,
    @Req() request: RequestLike,
  ) {
    return this.shares.grant(scenarioId, body, request);
  }

  @Delete(":scenarioId/:userId")
  revoke(
    @Param("scenarioId") scenarioId: string,
    @Param("userId") userId: string,
    @Req() request: RequestLike,
  ) {
    return this.shares.revoke(scenarioId, userId, request);
  }
}
