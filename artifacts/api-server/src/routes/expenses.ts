import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  ListExpensesResponse,
  CreateExpenseBody,
  GetExpenseParams,
  GetExpenseResponse,
  UpdateExpenseParams,
  UpdateExpenseBody,
  UpdateExpenseResponse,
  DeleteExpenseParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/expenses", async (req, res): Promise<void> => {
  const { category, month } = req.query as { category?: string; month?: string };

  let rows = await db.select().from(expensesTable).orderBy(expensesTable.date);

  if (category) {
    rows = rows.filter((r) => r.category === category);
  }
  if (month) {
    rows = rows.filter((r) => r.date.startsWith(month));
  }

  const mapped = rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));

  res.json(ListExpensesResponse.parse(mapped));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(expensesTable).values(parsed.data).returning();
  res.status(201).json(GetExpenseResponse.parse({ ...row, amount: parseFloat(row.amount) }));
});

router.get("/expenses/:id", async (req, res): Promise<void> => {
  const params = GetExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(GetExpenseResponse.parse({ ...row, amount: parseFloat(row.amount) }));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(expensesTable)
    .set(parsed.data)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(UpdateExpenseResponse.parse({ ...row, amount: parseFloat(row.amount) }));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
