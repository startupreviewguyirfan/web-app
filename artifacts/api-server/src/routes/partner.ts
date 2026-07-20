import { Hono } from "hono";
import { partnerInquiriesTable } from "@workspace/db";
import { SubmitPartnerInquiryBody } from "@workspace/api-zod";
import type { AppEnv } from "../types";

const partner = new Hono<AppEnv>();

partner.post("/partner", async (c) => {
  const body = await c.req.json();

  // Honeypot check — bots fill hidden fields
  if (body.honeypot) {
    // Silently accept to not reveal the check
    return c.json(
      {
        id: "ok",
        companyName: "",
        contactName: "",
        email: "",
        message: "",
        createdAt: new Date().toISOString(),
        status: "new",
      },
      201,
    );
  }

  const parsed = SubmitPartnerInquiryBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { companyName, contactName, email, website, message, budgetRange } = parsed.data;
  const db = c.get("db");

  const [inquiry] = await db
    .insert(partnerInquiriesTable)
    .values({
      companyName,
      contactName,
      email,
      website: website ?? null,
      message,
      budgetRange: budgetRange ?? null,
    })
    .returning();

  console.log("New partner inquiry submitted", { email, companyName });

  return c.json({ ...inquiry, createdAt: inquiry.createdAt.toISOString() }, 201);
});

export default partner;
