import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { ListTransactionsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const { limit, type } = req.query as { limit?: string; type?: string };

  let rows = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.date));

  if (type) {
    rows = rows.filter((r) => r.type === type);
  }

  const limitNum = limit ? parseInt(limit, 10) : undefined;
  if (limitNum && !isNaN(limitNum)) {
    rows = rows.slice(0, limitNum);
  }

  const mapped = rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));

  res.json(ListTransactionsResponse.parse(mapped));
});

export default router;
