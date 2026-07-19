import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerInquiriesTable = pgTable("partner_inquiries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  message: text("message").notNull(),
  budgetRange: text("budget_range"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("new"),
});

export const insertPartnerInquirySchema = createInsertSchema(partnerInquiriesTable).omit({ id: true, createdAt: true, status: true });
export type InsertPartnerInquiry = z.infer<typeof insertPartnerInquirySchema>;
export type PartnerInquiry = typeof partnerInquiriesTable.$inferSelect;
