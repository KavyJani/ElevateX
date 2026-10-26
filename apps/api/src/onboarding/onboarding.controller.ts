import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ONBOARDING } from "./onboarding.config";
@Controller("onboarding")
export class OnboardingController {
  @Get(":role/steps") roleSteps(@Param("role") role: string) {
    if (role !== "investor" && role !== "founder")
      throw new NotFoundException("Role must be investor or founder");
    return { role, steps: ONBOARDING[role] };
  }
  @Get("config/:role") config(@Param("role") role: string) {
    if (role !== "investor" && role !== "founder")
      throw new NotFoundException("Role must be investor or founder");
    return { role, steps: ONBOARDING[role] };
  }
  @Get("config/:role/:step") step(
    @Param("role") role: string,
    @Param("step") step: string,
  ) {
    if (role !== "investor" && role !== "founder")
      throw new NotFoundException("Invalid role");
    const x = ONBOARDING[role].find(
      (s) => s.id === step || s.id === `${role}-${step}`,
    );
    if (!x) throw new NotFoundException("Step not found");
    return x;
  }
}
