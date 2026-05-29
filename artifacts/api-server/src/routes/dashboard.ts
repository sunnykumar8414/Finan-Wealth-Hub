import { Router, type IRouter } from "express";
import { db, expensesTable, investmentsTable, transactionsTable, budgetsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetSpendingByCategoryResponse,
  GetMonthlyTrendResponse,
  GetPortfolioPerformanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const expenses = await db.select().from(expensesTable);
  const investments = await db.select().from(investmentsTable);

  const incomeRows = expenses.filter((e) => e.type === "income");
  const expenseRows = expenses.filter((e) => e.type === "expense");

  const totalIncome = incomeRows.reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + parseFloat(r.amount), 0);

  const totalInvestmentCost = investments.reduce(
    (s, r) => s + parseFloat(r.shares) * parseFloat(r.purchasePrice),
    0
  );
  const totalInvestmentValue = investments.reduce(
    (s, r) => s + parseFloat(r.shares) * parseFloat(r.currentPrice),
    0
  );
  const investmentGain = totalInvestmentValue - totalInvestmentCost;
  const investmentGainPercent = totalInvestmentCost > 0 ? (investmentGain / totalInvestmentCost) * 100 : 0;

  const totalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  const thisMonthExpenses = expenseRows.filter((r) => r.date.startsWith(thisMonth)).reduce((s, r) => s + parseFloat(r.amount), 0);
  const lastMonthExpenses = expenseRows.filter((r) => r.date.startsWith(lastMonth)).reduce((s, r) => s + parseFloat(r.amount), 0);
  const monthlyChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  res.json(GetDashboardSummaryResponse.parse({
    totalBalance,
    totalExpenses,
    totalIncome,
    totalInvestments: totalInvestmentValue,
    savingsRate,
    monthlyChange,
    investmentGain,
    investmentGainPercent,
  }));
});

router.get("/dashboard/spending-by-category", async (req, res): Promise<void> => {
  const { month } = req.query as { month?: string };

  let rows = await db.select().from(expensesTable);
  rows = rows.filter((r) => r.type === "expense");

  if (month) {
    rows = rows.filter((r) => r.date.startsWith(month));
  }

  const categoryMap: Record<string, number> = {};
  for (const row of rows) {
    const amt = parseFloat(row.amount);
    categoryMap[row.category] = (categoryMap[row.category] || 0) + amt;
  }

  const total = Object.values(categoryMap).reduce((s, v) => s + v, 0);
  const palette = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#f97316", "#14b8a6"];

  const result = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount], i) => ({
      category,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
      color: palette[i % palette.length],
    }));

  res.json(GetSpendingByCategoryResponse.parse(result));
});

router.get("/dashboard/monthly-trend", async (_req, res): Promise<void> => {
  const rows = await db.select().from(expensesTable);

  const monthMap: Record<string, { income: number; expenses: number }> = {};

  for (const row of rows) {
    const month = row.date.substring(0, 7);
    if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
    const amt = parseFloat(row.amount);
    if (row.type === "income") {
      monthMap[month].income += amt;
    } else {
      monthMap[month].expenses += amt;
    }
  }

  const sorted = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      savings: data.income - data.expenses,
    }));

  res.json(GetMonthlyTrendResponse.parse(sorted));
});

router.get("/dashboard/portfolio-performance", async (_req, res): Promise<void> => {
  const investments = await db.select().from(investmentsTable);

  const totalCost = investments.reduce((s, r) => s + parseFloat(r.shares) * parseFloat(r.purchasePrice), 0);
  const totalValue = investments.reduce((s, r) => s + parseFloat(r.shares) * parseFloat(r.currentPrice), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const now = new Date();
  const history = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (11 - i));
    const factor = 0.75 + (i / 11) * 0.25 + (Math.random() - 0.5) * 0.05;
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: parseFloat((totalValue * factor).toFixed(2)),
    };
  });

  const typeMap: Record<string, { value: number }> = {};
  for (const inv of investments) {
    const val = parseFloat(inv.shares) * parseFloat(inv.currentPrice);
    if (!typeMap[inv.type]) typeMap[inv.type] = { value: 0 };
    typeMap[inv.type].value += val;
  }

  const palette: Record<string, string> = {
    stock: "#6366f1",
    etf: "#06b6d4",
    crypto: "#f59e0b",
    bond: "#10b981",
    mutual_fund: "#8b5cf6",
  };

  const allocation = Object.entries(typeMap).map(([type, data]) => ({
    type,
    percent: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    value: data.value,
    color: palette[type] || "#94a3b8",
  }));

  res.json(GetPortfolioPerformanceResponse.parse({
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    history,
    allocation,
  }));
});

export default router;
