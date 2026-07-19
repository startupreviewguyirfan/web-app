import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { startupsTable } from "./startups";

export const foundersTable = pgTable("founders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  startupId: text("startup_id").notNull().references(() => startupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  linkedinUrl: text("linkedin_url"),
  photoUrl: text("photo_url"),
});

export const insertFounderSchema = createInsertSchema(foundersTable).omit({ id: true });
export type InsertFounder = z.infer<typeof insertFounderSchema>;
export type Founder = typeof foundersTable.$inferSelect;
