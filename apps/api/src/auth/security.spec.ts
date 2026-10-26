import { ONBOARDING } from "../onboarding/onboarding.config";
import { ForbiddenException } from "@nestjs/common";
import { assertInvestorApplicationApproved } from "./session";

describe("role and authorization safety contract", () => {
  it("requires explicit admin approval, not just identity verification", () => {
    expect(() => assertInvestorApplicationApproved("APPROVED")).not.toThrow();
    for (const status of ["PENDING", "REJECTED", "INFO_REQUESTED", undefined])
      expect(() => assertInvestorApplicationApproved(status)).toThrow(
        ForbiddenException,
      );
  });

  it("has exactly twelve config steps per public role", () => {
    expect(ONBOARDING.investor).toHaveLength(12);
    expect(ONBOARDING.founder).toHaveLength(12);
  });
  it("does not offer admin as a registration role", () => {
    expect(["investor", "founder"]).not.toContain("admin");
  });
  it("does not pre-check declaration booleans", () => {
    for (const role of ["investor", "founder"] as const)
      for (const step of ONBOARDING[role])
        for (const f of step.fields.filter((x) => x.type === "checkbox" || x.type === "toggle"))
          expect(f).not.toHaveProperty("default", true);
  });
});
