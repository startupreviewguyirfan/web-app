import { Hono } from "hono";
import { eq, ilike, and, or, sql, desc, ne } from "drizzle-orm";
import { startupsTable, foundersTable } from "@workspace/db";
import { ListStartupsQueryParams, GetStartupParams } from "@workspace/api-zod";
import type { AppEnv } from "../types";

const startups = new Hono<AppEnv>();

const summaryColumns = {
  id: startupsTable.id,
  slug: startupsTable.slug,
  name: startupsTable.name,
  tagline: startupsTable.tagline,
  category: startupsTable.category,
  tags: startupsTable.tags,
  logoUrl: startupsTable.logoUrl,
  youtubeVideoId: startupsTable.youtubeVideoId,
  fundingStage: startupsTable.fundingStage,
  reviewedAt: startupsTable.reviewedAt,
  published: startupsTable.published,
};

// GET /startups — list published startups with filters
startups.get("/startups", async (c) => {
  const parsed = ListStartupsQueryParams.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");
  const { category, fundingStage, search, page = 1, limit = 12 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(startupsTable.published, true)];

  if (category) conditions.push(eq(startupsTable.category, category));
  if (fundingStage) conditions.push(eq(startupsTable.fundingStage, fundingStage));
  if (search) {
    conditions.push(
      or(
        ilike(startupsTable.name, `%${search}%`),
        ilike(startupsTable.tagline, `%${search}%`),
        ilike(startupsTable.category, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select(summaryColumns)
      .from(startupsTable)
      .where(where)
      .orderBy(desc(startupsTable.reviewedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(startupsTable).where(where),
  ]);

  return c.json({
    startups: rows.map((s) => ({ ...s, reviewedAt: s.reviewedAt.toISOString() })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /startups/featured — latest 6 published startups for homepage
startups.get("/startups/featured", async (c) => {
  const db = c.get("db");

  const rows = await db
    .select(summaryColumns)
    .from(startupsTable)
    .where(eq(startupsTable.published, true))
    .orderBy(desc(startupsTable.reviewedAt))
    .limit(6);

  return c.json(rows.map((s) => ({ ...s, reviewedAt: s.reviewedAt.toISOString() })));
});

// GET /startups/categories — unique category list
startups.get("/startups/categories", async (c) => {
  const db = c.get("db");

  const rows = await db
    .selectDistinct({ category: startupsTable.category })
    .from(startupsTable)
    .where(eq(startupsTable.published, true))
    .orderBy(startupsTable.category);

  return c.json(rows.map((r) => r.category));
});

// GET /stats — site stats
startups.get("/stats", async (c) => {
  const db = c.get("db");

  const [reviewsResult, categoriesResult] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(startupsTable).where(eq(startupsTable.published, true)),
    db.selectDistinct({ category: startupsTable.category }).from(startupsTable).where(eq(startupsTable.published, true)),
  ]);

  return c.json({
    totalReviews: reviewsResult[0]?.count ?? 0,
    totalCategories: categoriesResult.length,
    subscriberCount: null,
    totalViews: null,
  });
});

// GET /startups/:slug — individual startup page
startups.get("/startups/:slug", async (c) => {
  const params = GetStartupParams.safeParse({ slug: c.req.param("slug") });
  if (!params.success) {
    return c.json({ error: params.error.message }, 400);
  }

  const db = c.get("db");

  const [startup] = await db
    .select()
    .from(startupsTable)
    .where(
      and(
        eq(startupsTable.slug, params.data.slug),
        eq(startupsTable.published, true),
      ),
    );

  if (!startup) {
    return c.json({ error: "Startup not found" }, 404);
  }

  const founders = await db
    .select()
    .from(foundersTable)
    .where(eq(foundersTable.startupId, startup.id));

  // Related startups (same category, different slug)
  const related = await db
    .select(summaryColumns)
    .from(startupsTable)
    .where(
      and(
        eq(startupsTable.category, startup.category),
        eq(startupsTable.published, true),
        ne(startupsTable.id, startup.id),
      ),
    )
    .limit(4);

  return c.json({
    ...startup,
    reviewedAt: startup.reviewedAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
    founders,
    relatedStartups: related.map((s) => ({ ...s, reviewedAt: s.reviewedAt.toISOString() })),
  });
});

export default startups;
