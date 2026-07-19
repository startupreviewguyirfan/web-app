import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const startupsTable = pgTable("startups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  youtubeVideoId: text("youtube_video_id").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  fundingStage: text("funding_stage"),
  totalRaised: text("total_raised"),
  notableInvestors: text("notable_investors"),
  lastRoundDate: text("last_round_date"),
  revenueArr: text("revenue_arr"),
  revenueEstimated: boolean("revenue_estimated").notNull().default(false),
  competitors: text("competitors"),
  useCase: text("use_case"),
  verdict: text("verdict"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  published: boolean("published").notNull().default(true),
});

export const insertStartupSchema = createInsertSchema(startupsTable).omit({ id: true, reviewedAt: true, updatedAt: true });
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type Startup = typeof startupsTable.$inferSelect;
