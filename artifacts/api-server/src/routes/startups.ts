import { Router, type IRouter } from "express";
import { eq, ilike, and, or, sql, desc, ne } from "drizzle-orm";
import { db, startupsTable, foundersTable } from "@workspace/db";
import {
  ListStartupsQueryParams,
  GetStartupParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /startups — list published startups with filters
router.get("/startups", async (req, res): Promise<void> => {
  const parsed = ListStartupsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

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

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [startups, countResult] = await Promise.all([
    db
      .select({
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
      })
      .from(startupsTable)
      .where(where)
      .orderBy(desc(startupsTable.reviewedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(startupsTable)
      .where(where),
  ]);

  res.json({
    startups: startups.map((s) => ({
      ...s,
      reviewedAt: s.reviewedAt.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /startups/featured — latest 6 published startups for homepage
router.get("/startups/featured", async (_req, res): Promise<void> => {
  const startups = await db
    .select({
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
    })
    .from(startupsTable)
    .where(eq(startupsTable.published, true))
    .orderBy(desc(startupsTable.reviewedAt))
    .limit(6);

  res.json(
    startups.map((s) => ({
      ...s,
      reviewedAt: s.reviewedAt.toISOString(),
    })),
  );
});

// GET /startups/categories — unique category list
router.get("/startups/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ category: startupsTable.category })
    .from(startupsTable)
    .where(eq(startupsTable.published, true))
    .orderBy(startupsTable.category);

  res.json(rows.map((r) => r.category));
});

// GET /stats — site stats
router.get("/stats", async (_req, res): Promise<void> => {
  const [reviewsResult, categoriesResult] = await Promise.all([
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(startupsTable)
      .where(eq(startupsTable.published, true)),
    db
      .selectDistinct({ category: startupsTable.category })
      .from(startupsTable)
      .where(eq(startupsTable.published, true)),
  ]);

  res.json({
    totalReviews: reviewsResult[0]?.count ?? 0,
    totalCategories: categoriesResult.length,
    subscriberCount: null,
    totalViews: null,
  });
});

// GET /startups/:slug — individual startup page
router.get("/startups/:slug", async (req, res): Promise<void> => {
  const params = GetStartupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

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
    res.status(404).json({ error: "Startup not found" });
    return;
  }

  const founders = await db
    .select()
    .from(foundersTable)
    .where(eq(foundersTable.startupId, startup.id));

  // Related startups (same category, different slug)
  const related = await db
    .select({
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
    })
    .from(startupsTable)
    .where(
      and(
        eq(startupsTable.category, startup.category),
        eq(startupsTable.published, true),
        ne(startupsTable.id, startup.id),
      ),
    )
    .limit(4);

  res.json({
    ...startup,
    reviewedAt: startup.reviewedAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
    founders,
    relatedStartups: related.map((s) => ({
      ...s,
      reviewedAt: s.reviewedAt.toISOString(),
    })),
  });
});

export default router;
