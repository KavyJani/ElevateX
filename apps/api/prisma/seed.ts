import { PrismaClient } from "@prisma/client";
const url = process.env.ELEVATEX_DATABASE_URL;
if (!url) throw new Error("Seed requires ELEVATEX_DATABASE_URL.");
const db = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const demos = [
    { slug: "northstar-climate", name: "Northstar Climate", tagline: "Lower-waste logistics for urban supply chains", industry: "Climate", stage: "Prototype", businessModel: "B2B SaaS", location: "Toronto, Canada", description: "DEMO ONLY — illustrative sample profile. No real company, verified traction, financing history or outcome is represented." },
    { slug: "careloop-health", name: "CareLoop Health", tagline: "Coordinated care tools for distributed clinics", industry: "Health", stage: "Idea", businessModel: "B2B", location: "Austin, United States", description: "DEMO ONLY — illustrative sample profile. No real company, verified traction, financing history or outcome is represented." },
  ];
  for (const startup of demos) await db.startup.upsert({ where: { slug: startup.slug }, create: { ...startup, isDemo: true, publicApproved: true }, update: { ...startup, isDemo: true, publicApproved: true } });
}
main().finally(() => db.$disconnect());
