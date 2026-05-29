import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBudgets, useCreateBudget, getListBudgetsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/format";

const CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Health", "Utilities", "Shopping", "Travel", "Other"];
const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#f97316", "#14b8a6", "#94a3b8"];

function BudgetForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateBudget();
  const [form, setForm] = useState({
    category: "Food",
    limit: "",
    month: new Date().toISOString().slice(0, 7),
    color: "#6366f1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: { ...form, limit: parseFloat(form.limit) } });
    qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Create Budget</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Category</span>
            <select className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary"
              value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Monthly Limit (USD)</span>
            <input type="number" step="0.01" min="0" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary font-mono-nums"
              value={form.limit} onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))} placeholder="500.00" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Month</span>
            <input type="month" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary"
              value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} required />
          </label>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-6 w-6 rounded-full transition-transform ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Budget"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Budgets() {
  const [showForm, setShowForm] = useState(false);
  const { data: budgets, isLoading } = useListBudgets();

  const totalLimit = (budgets ?? []).reduce((s, b) => s + b.limit, 0);
  const totalSpent = (budgets ?? []).reduce((s, b) => s + b.spent, 0);
  const overBudget = (budgets ?? []).filter((b) => b.spent > b.limit).length;

  return (
    <div>
      <TopBar title="Budgets" subtitle="Set limits and track your spending by category" />
      <div className="px-8 py-6 space-y-5">

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
            <p className="text-xl font-mono-nums font-bold text-foreground">{formatCurrency(totalLimit, true)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-xl font-mono-nums font-bold text-foreground">{formatCurrency(totalSpent, true)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Over Budget</p>
            <p className={`text-xl font-mono-nums font-bold ${overBudget > 0 ? "text-destructive" : "text-positive"}`}>
              {overBudget} {overBudget === 1 ? "category" : "categories"}
            </p>
          </div>
        </div>

        {/* Budgets */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Monthly Budgets</p>
          <button onClick={() => setShowForm(true)}
            className="h-8 px-3 flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />New Budget
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (budgets ?? []).length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
            No budgets created yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(budgets ?? []).map((budget, i) => {
              const pct = Math.min((budget.spent / budget.limit) * 100, 100);
              const isOver = budget.spent > budget.limit;
              const isWarning = pct > 80 && !isOver;
              const color = budget.color ?? "#6366f1";
              return (
                <motion.div key={budget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${color}18`, color }}>
                        {budget.category.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{budget.category}</p>
                        <p className="text-xs text-muted-foreground">{budget.month}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isOver ? (
                        <><AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-xs font-medium text-destructive">Over limit</span></>
                      ) : isWarning ? (
                        <><AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-400">Near limit</span></>
                      ) : (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-positive" />
                          <span className="text-xs font-medium text-positive">On track</span></>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-mono-nums font-medium text-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 + 0.2, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: isOver ? "hsl(0,72%,58%)" : isWarning ? "#f59e0b" : color }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{pct.toFixed(0)}% used</span>
                      <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {isOver ? `${formatCurrency(budget.spent - budget.limit)} over` : `${formatCurrency(budget.limit - budget.spent)} left`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && <BudgetForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
