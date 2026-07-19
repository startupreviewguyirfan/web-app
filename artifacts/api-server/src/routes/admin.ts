import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { db, startupsTable, foundersTable, partnerInquiriesTable } from "@workspace/db";
import {
  AdminListStartupsQueryParams,
  CreateStartupBody,
  UpdateStartupBody,
  UpdateStartupParams,
  DeleteStartupParams,
  AdminListInquiriesQueryParams,
  UpdateInquiryParams,
  UpdateInquiryBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/require-admin";

const router: IRouter = Router();

// Apply admin guard to all routes
router.use(requireAdmin);

// GET /admin/startups
router.get("/admin/startups", async (req, res): Promise<void> => {
  const parsed = AdminListStartupsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = search
    ? [ilike(startupsTable.name, `%${search}%`)]
    : [];

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

// POST /admin/startups
router.post("/admin/startups", async (req, res): Promise<void> => {
  const parsed = CreateStartupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { founders: founderInputs, ...startupData } = parsed.data;

  const [startup] = await db
    .insert(startupsTable)
    .values({
      ...startupData,
      tags: startupData.tags ?? [],
      published: startupData.published ?? true,
      revenueEstimated: startupData.revenueEstimated ?? false,
    })
    .returning();

  let founders: typeof foundersTable.$inferSelect[] = [];
  if (founderInputs && founderInputs.length > 0) {
    founders = await db
      .insert(foundersTable)
      .values(founderInputs.map((f) => ({ ...f, startupId: startup.id })))
      .returning();
  }

  res.status(201).json({
    ...startup,
    reviewedAt: startup.reviewedAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
    founders,
    relatedStartups: [],
  });
});

// PUT /admin/startups/:id
router.put("/admin/startups/:id", async (req, res): Promise<void> => {
  const params = UpdateStartupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStartupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { founders: founderInputs, ...startupData } = parsed.data;

  const [startup] = await db
    .update(startupsTable)
    .set(startupData)
    .where(eq(startupsTable.id, params.data.id))
    .returning();

  if (!startup) {
    res.status(404).json({ error: "Startup not found" });
    return;
  }

  // Replace founders if provided
  let founders: typeof foundersTable.$inferSelect[] = [];
  if (founderInputs !== undefined) {
    await db.delete(foundersTable).where(eq(foundersTable.startupId, startup.id));
    if (founderInputs.length > 0) {
      founders = await db
        .insert(foundersTable)
        .values(founderInputs.map((f) => ({ ...f, startupId: startup.id })))
        .returning();
    }
  } else {
    founders = await db
      .select()
      .from(foundersTable)
      .where(eq(foundersTable.startupId, startup.id));
  }

  res.json({
    ...startup,
    reviewedAt: startup.reviewedAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
    founders,
    relatedStartups: [],
  });
});

// DELETE /admin/startups/:id
router.delete("/admin/startups/:id", async (req, res): Promise<void> => {
  const params = DeleteStartupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(startupsTable)
    .where(eq(startupsTable.id, params.data.id))
    .returning({ id: startupsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Startup not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /admin/inquiries
router.get("/admin/inquiries", async (req, res): Promise<void> => {
  const parsed = AdminListInquiriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = parsed.data.status
    ? [eq(partnerInquiriesTable.status, parsed.data.status)]
    : [];

  const inquiries = await db
    .select()
    .from(partnerInquiriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(partnerInquiriesTable.createdAt));

  res.json(
    inquiries.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
  );
});

// PATCH /admin/inquiries/:id
router.patch("/admin/inquiries/:id", async (req, res): Promise<void> => {
  const params = UpdateInquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db
    .update(partnerInquiriesTable)
    .set({ status: parsed.data.status })
    .where(eq(partnerInquiriesTable.id, params.data.id))
    .returning();

  if (!inquiry) {
    res.status(404).json({ error: "Inquiry not found" });
    return;
  }

  res.json({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
  });
});

export default router;
