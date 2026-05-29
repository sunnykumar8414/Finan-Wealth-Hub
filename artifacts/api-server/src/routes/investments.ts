import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, investmentsTable } from "@workspace/db";
import {
  ListInvestmentsResponse,
  CreateInvestmentBody,
  UpdateInvestmentParams,
  UpdateInvestmentBody,
  UpdateInvestmentResponse,
  DeleteInvestmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapInvestment(r: typeof investmentsTable.$inferSelect) {
  const shares = parseFloat(r.shares);
  const purchasePrice = parseFloat(r.purchasePrice);
  const currentPrice = parseFloat(r.currentPrice);
  const totalCost = shares * purchasePrice;
  const currentValue = shares * currentPrice;
  return {
    ...r,
    shares,
    purchasePrice,
    currentPrice,
    allocationPercent: 0,
  };
}

router.get("/investments", async (_req, res): Promise<void> => {
  const rows = await db.select().from(investmentsTable).orderBy(investmentsTable.name);
  const mapped = rows.map(mapInvestment);

  const totalValue = mapped.reduce((sum, r) => sum + r.shares * r.currentPrice, 0);
  const withAllocation = mapped.map((r) => ({
    ...r,
    allocationPercent: totalValue > 0 ? ((r.shares * r.currentPrice) / totalValue) * 100 : 0,
  }));

  res.json(ListInvestmentsResponse.parse(withAllocation));
});

router.post("/investments", async (req, res): Promise<void> => {
  const parsed = CreateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(investmentsTable).values(parsed.data).returning();
  res.status(201).json(mapInvestment(row));
});

router.patch("/investments/:id", async (req, res): Promise<void> => {
  const params = UpdateInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(investmentsTable)
    .set(parsed.data)
    .where(eq(investmentsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  res.json(UpdateInvestmentResponse.parse(mapInvestment(row)));
});

router.delete("/investments/:id", async (req, res): Promise<void> => {
  const params = DeleteInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.delete(investmentsTable).where(eq(investmentsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
