import { Hono } from "hono";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { startupsTable, foundersTable, partnerInquiriesTable } from "@workspace/db";
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
import type { AppEnv } from "../types";
import { requireAdmin } from "../middlewares/require-admin";

const admin = new Hono<AppEnv>();

// Apply admin guard to all routes
admin.use("*", requireAdmin);

// GET /admin/startups
admin.get("/admin/startups", async (c) => {
  const parsed = AdminListStartupsQueryParams.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");
  const { page = 1, limit = 20, search } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = search ? [ilike(startupsTable.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
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
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(startupsTable).where(where),
  ]);

  return c.json({
    startups: rows.map((s) => ({ ...s, reviewedAt: s.reviewedAt.toISOString() })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// POST /admin/startups
admin.post("/admin/startups", async (c) => {
  const parsed = CreateStartupBody.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");
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

  let founders: (typeof foundersTable.$inferSelect)[] = [];
  if (founderInputs && founderInputs.length > 0) {
    founders = await db
      .insert(foundersTable)
      .values(founderInputs.map((f) => ({ ...f, startupId: startup.id })))
      .returning();
  }

  return c.json(
    {
      ...startup,
      reviewedAt: startup.reviewedAt.toISOString(),
      updatedAt: startup.updatedAt.toISOString(),
      founders,
      relatedStartups: [],
    },
    201,
  );
});

// PUT /admin/startups/:id
admin.put("/admin/startups/:id", async (c) => {
  const params = UpdateStartupParams.safeParse({ id: c.req.param("id") });
  if (!params.success) {
    return c.json({ error: params.error.message }, 400);
  }

  const parsed = UpdateStartupBody.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");
  const { founders: founderInputs, ...startupData } = parsed.data;

  const [startup] = await db
    .update(startupsTable)
    .set(startupData)
    .where(eq(startupsTable.id, params.data.id))
    .returning();

  if (!startup) {
    return c.json({ error: "Startup not found" }, 404);
  }

  // Replace founders if provided
  let founders: (typeof foundersTable.$inferSelect)[] = [];
  if (founderInputs !== undefined) {
    await db.delete(foundersTable).where(eq(foundersTable.startupId, startup.id));
    if (founderInputs.length > 0) {
      founders = await db
        .insert(foundersTable)
        .values(founderInputs.map((f) => ({ ...f, startupId: startup.id })))
        .returning();
    }
  } else {
    founders = await db.select().from(foundersTable).where(eq(foundersTable.startupId, startup.id));
  }

  return c.json({
    ...startup,
    reviewedAt: startup.reviewedAt.toISOString(),
    updatedAt: startup.updatedAt.toISOString(),
    founders,
    relatedStartups: [],
  });
});

// DELETE /admin/startups/:id
admin.delete("/admin/startups/:id", async (c) => {
  const params = DeleteStartupParams.safeParse({ id: c.req.param("id") });
  if (!params.success) {
    return c.json({ error: params.error.message }, 400);
  }

  const db = c.get("db");

  const [deleted] = await db
    .delete(startupsTable)
    .where(eq(startupsTable.id, params.data.id))
    .returning({ id: startupsTable.id });

  if (!deleted) {
    return c.json({ error: "Startup not found" }, 404);
  }

  return c.body(null, 204);
});

// GET /admin/inquiries
admin.get("/admin/inquiries", async (c) => {
  const parsed = AdminListInquiriesQueryParams.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");
  const conditions = parsed.data.status ? [eq(partnerInquiriesTable.status, parsed.data.status)] : [];

  const inquiries = await db
    .select()
    .from(partnerInquiriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(partnerInquiriesTable.createdAt));

  return c.json(inquiries.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })));
});

// PATCH /admin/inquiries/:id
admin.patch("/admin/inquiries/:id", async (c) => {
  const params = UpdateInquiryParams.safeParse({ id: c.req.param("id") });
  if (!params.success) {
    return c.json({ error: params.error.message }, 400);
  }

  const parsed = UpdateInquiryBody.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const db = c.get("db");

  const [inquiry] = await db
    .update(partnerInquiriesTable)
    .set({ status: parsed.data.status })
    .where(eq(partnerInquiriesTable.id, params.data.id))
    .returning();

  if (!inquiry) {
    return c.json({ error: "Inquiry not found" }, 404);
  }

  return c.json({ ...inquiry, createdAt: inquiry.createdAt.toISOString() });
});

export default admin;
