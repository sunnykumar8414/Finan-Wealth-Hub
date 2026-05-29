import { Router, type IRouter } from "express";
import { db, budgetsTable } from "@workspace/db";
import { ListBudgetsResponse, CreateBudgetBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/budgets", async (_req, res): Promise<void> => {
  const rows = await db.select().from(budgetsTable).orderBy(budgetsTable.category);
  const mapped = rows.map((r) => ({
    ...r,
    limit: parseFloat(r.limit),
    spent: parseFloat(r.spent),
  }));
  res.json(ListBudgetsResponse.parse(mapped));
});

router.post("/budgets", async (req, res): Promise<void> => {
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(budgetsTable).values(parsed.data).returning();
  res.status(201).json({
    ...row,
    limit: parseFloat(row.limit),
    spent: parseFloat(row.spent),
  });
});

export default router;
