import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { prisma as db } from "../auth/session";

const demo = [
  {
    id: "demo-northstar-climate",
    slug: "northstar-climate",
    name: "Northstar Climate",
    tagline: "Illustrative demo listing for climate operations.",
    industry: "Climate",
    stage: "Seed",
    businessModel: "B2B SaaS",
    summary:
      "Demo-only profile; not a verified company or investment opportunity.",
    description:
      "Demo-only profile; not a verified company or investment opportunity.",
    location: "Toronto, Canada",
    isDemo: true,
  },
  {
    id: "demo-careloop-health",
    slug: "careloop-health",
    name: "CareLoop Health",
    tagline: "Illustrative demo listing for care coordination.",
    industry: "Health",
    stage: "Pre-seed",
    businessModel: "Marketplace",
    summary:
      "Demo-only profile; not a verified company or investment opportunity.",
    description:
      "Demo-only profile; not a verified company or investment opportunity.",
    location: "Austin, United States",
    isDemo: true,
  },
];
const clean = (value: string | undefined) => (value || "").trim().slice(0, 120);
const contains = (value: string) => ({
  contains: value,
  mode: "insensitive" as const,
});
function mapPublic<
  T extends {
    description: string | null;
    businessModel: string | null;
    stage: string | null;
    location: string | null;
  },
>(item: T) {
  return {
    ...item,
    summary: item.description || "The company has not added a public summary.",
    businessModel: item.businessModel || "Not specified",
    stage: item.stage || "Unspecified",
    location: item.location || "Not shared",
  };
}

@Controller("startups")
export class StartupsController {
  @Get()
  async list(
    @Query("q") query: string,
    @Query("industry") industryQuery: string,
    @Query("stage") stageQuery: string,
    @Query("businessModel") modelQuery: string,
    @Query("location") locationQuery: string,
    @Query("sort") sortQuery: string,
    @Query("page") pageQuery: string,
    @Query("limit") limitQuery: string,
  ) {
    const q = clean(query);
    const industry = clean(industryQuery);
    const stage = clean(stageQuery);
    const businessModel = clean(modelQuery);
    const location = clean(locationQuery);
    const page = Math.max(
      1,
      Math.min(10000, Number.parseInt(pageQuery || "1", 10) || 1),
    );
    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(limitQuery || "12", 10) || 12),
    );
    if (!process.env.ELEVATEX_DATABASE_URL) {
      const filtered = demo.filter(
        (item) =>
          (!q ||
            `${item.name} ${item.tagline} ${item.industry} ${item.location} ${item.businessModel}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!industry || item.industry === industry) &&
          (!stage || item.stage === stage) &&
          (!businessModel || item.businessModel === businessModel) &&
          (!location ||
            item.location.toLowerCase().includes(location.toLowerCase())),
      );
      const sorted =
        sortQuery === "name"
          ? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
          : sortQuery === "stage"
            ? [...filtered].sort((a, b) => a.stage.localeCompare(b.stage))
            : filtered;
      return {
        source: "demo",
        items: sorted.slice((page - 1) * limit, page * limit),
        page,
        pageSize: limit,
        total: filtered.length,
        facets: {
          industries: [...new Set(demo.map((x) => x.industry))],
          stages: [...new Set(demo.map((x) => x.stage))],
          businessModels: [...new Set(demo.map((x) => x.businessModel))],
          locations: [
            ...new Set(
              demo.map(
                (x) => x.location.split(",").at(-1)?.trim() || x.location,
              ),
            ),
          ],
        },
      };
    }
    const where = {
      publicApproved: true,
      ...(industry ? { industry } : {}),
      ...(stage ? { stage } : {}),
      ...(businessModel ? { businessModel } : {}),
      ...(location ? { location: contains(location) } : {}),
      ...(q
        ? {
            OR: [
              { name: contains(q) },
              { tagline: contains(q) },
              { industry: contains(q) },
              { businessModel: contains(q) },
              { description: contains(q) },
              { location: contains(q) },
            ],
          }
        : {}),
    };
    try {
      const orderBy =
        sortQuery === "name"
          ? { name: "asc" as const }
          : sortQuery === "stage"
            ? { stage: "asc" as const }
            : { updatedAt: "desc" as const };
      const [total, rows, industries, stages, models, locations] =
        await Promise.all([
          db.startup.count({ where }),
          db.startup.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              industry: true,
              stage: true,
              businessModel: true,
              description: true,
              location: true,
              isDemo: true,
            },
          }),
          db.startup.groupBy({
            by: ["industry"],
            where: { publicApproved: true },
          }),
          db.startup.groupBy({
            by: ["stage"],
            where: { publicApproved: true, stage: { not: null } },
          }),
          db.startup.groupBy({
            by: ["businessModel"],
            where: { publicApproved: true, businessModel: { not: null } },
          }),
          db.startup.findMany({
            where: { publicApproved: true, location: { not: null } },
            select: { location: true },
            distinct: ["location"],
          }),
        ]);
      return {
        source: "database",
        items: rows.map(mapPublic),
        page,
        pageSize: limit,
        total,
        facets: {
          industries: industries.map((x) => x.industry),
          stages: stages
            .map((x) => x.stage)
            .filter((x): x is string => Boolean(x)),
          businessModels: models
            .map((x) => x.businessModel)
            .filter((x): x is string => Boolean(x)),
          locations: locations
            .map(
              (x) => x.location?.split(",").at(-1)?.trim() || x.location || "",
            )
            .filter(Boolean),
        },
      };
    } catch {
      throw new ServiceUnavailableException(
        "Startup discovery could not reach PostgreSQL. Demo listings are not substituted for database results.",
      );
    }
  }

  @Get("stats")
  async stats() {
    if (!process.env.ELEVATEX_DATABASE_URL)
      return {
        source: "demo",
        counts: {
          startups: demo.length,
          founders: 0,
          industries: new Set(demo.map((x) => x.industry)).size,
        },
      };
    try {
      const [startups, founders, items] = await Promise.all([
        db.startup.count({ where: { publicApproved: true, isDemo: false } }),
        db.founderProfile.count({
          where: {
            user: {
              startups: { some: { publicApproved: true, isDemo: false } },
            },
          },
        }),
        db.startup.findMany({
          where: { publicApproved: true, isDemo: false },
          select: { industry: true },
        }),
      ]);
      return {
        source: "database",
        counts: {
          startups,
          founders,
          industries: new Set(items.map((x) => x.industry)).size,
        },
      };
    } catch {
      throw new ServiceUnavailableException(
        "Platform statistics could not be calculated from PostgreSQL.",
      );
    }
  }

  @Get(":slug")
  async detail(@Param("slug") slug: string) {
    if (!process.env.ELEVATEX_DATABASE_URL) {
      const item = demo.find((entry) => entry.slug === slug);
      if (!item) throw new NotFoundException("Startup unavailable");
      return item;
    }
    try {
      const item = await db.startup.findFirst({
        where: { slug, publicApproved: true },
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          industry: true,
          stage: true,
          businessModel: true,
          description: true,
          location: true,
          isDemo: true,
        },
      });
      if (!item) throw new NotFoundException("Startup unavailable");
      return mapPublic(item);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException(
        "Startup profile could not be loaded from PostgreSQL.",
      );
    }
  }
}
