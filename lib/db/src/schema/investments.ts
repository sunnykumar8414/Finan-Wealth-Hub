import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investmentsTable = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  shares: numeric("shares", { precision: 18, scale: 6 }).notNull(),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(),
  sector: text("sector"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvestmentSchema = createInsertSchema(investmentsTable).omit({ id: true, createdAt: true });
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investmentsTable.$inferSelect;
