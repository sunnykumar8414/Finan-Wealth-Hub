import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  limit: numeric("limit", { precision: 12, scale: 2 }).notNull(),
  spent: numeric("spent", { precision: 12, scale: 2 }).notNull().default("0"),
  month: text("month").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({ id: true, createdAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;
