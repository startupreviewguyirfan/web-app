import { Router, type IRouter } from "express";
import { db, partnerInquiriesTable } from "@workspace/db";
import { SubmitPartnerInquiryBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/partner", async (req, res): Promise<void> => {
  // Honeypot check — bots fill hidden fields
  if (req.body.honeypot) {
    // Silently accept to not reveal the check
    res.status(201).json({ id: "ok", companyName: "", contactName: "", email: "", message: "", createdAt: new Date().toISOString(), status: "new" });
    return;
  }

  const parsed = SubmitPartnerInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { companyName, contactName, email, website, message, budgetRange } = parsed.data;

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

  req.log.info({ email, companyName }, "New partner inquiry submitted");

  res.status(201).json({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
  });
});

export default router;
