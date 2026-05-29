import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Filter, TrendingDown, TrendingUp, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListExpenses, useCreateExpense, useDeleteExpense, useUpdateExpense,
  getListExpensesQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";

const CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Health", "Utilities", "Shopping", "Travel", "Income", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#6366f1", Food: "#06b6d4", Transport: "#f59e0b", Entertainment: "#10b981",
  Health: "#ef4444", Utilities: "#8b5cf6", Shopping: "#f97316", Travel: "#14b8a6",
  Income: "#22c55e", Other: "#94a3b8",
};

function Badge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? "#94a3b8";
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border"
      style={{ color, borderColor: `${color}30`, backgroundColor: `${color}12` }}>
      {category}
    </span>
  );
}

function ExpenseForm({ onClose, initial }: { onClose: () => void; initial?: any }) {
  const qc = useQueryClient();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    amount: initial?.amount?.toString() ?? "",
    category: initial?.category ?? "Food",
    date: initial?.date ?? new Date().toISOString().split("T")[0],
    type: initial?.type ?? "expense",
    note: initial?.note ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, amount: parseFloat(form.amount) };
    if (initial) {
      await updateMutation.mutateAsync({ id: initial.id, data });
    } else {
      await createMutation.mutateAsync({ data });
    }
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">{initial ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Title</span>
              <input className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Groceries" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Amount (USD)</span>
              <input type="number" step="0.01" min="0" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors font-mono-nums"
                value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Date</span>
              <input type="date" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <select className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <select className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Note (optional)</span>
              <input className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Add a note..." />
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : initial ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const qc = useQueryClient();
  const { data: expenses, isLoading } = useListExpenses();
  const deleteMutation = useDeleteExpense();

  const filtered = (expenses ?? []).filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  const totalIncome = filtered.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = filtered.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  };

  return (
    <div>
      <TopBar title="Expenses" subtitle="Track and manage your income and spending" />
      <div className="px-8 py-6 space-y-5">

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-positive/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-positive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="text-xl font-mono-nums font-bold text-foreground">{formatCurrency(totalIncome, true)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-mono-nums font-bold text-foreground">{formatCurrency(totalExpense, true)}</p>
            </div>
          </div>
        </div>

        {/* Filters + Add */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <select className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary"
            value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary"
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {(filterCategory || filterType) && (
            <button onClick={() => { setFilterCategory(""); setFilterType(""); }}
              className="h-8 px-2.5 flex items-center gap-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
              <X className="h-3 w-3" />Clear
            </button>
          )}
          <div className="ml-auto">
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="h-8 px-3 flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" />Add Expense
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3 border-b border-border bg-muted/30">
            {["Title", "Amount", "Category", "Date", ""].map((h) => (
              <p key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</p>
            ))}
          </div>
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No expenses found</div>
          ) : (
            <div className="divide-y divide-border/60">
              <AnimatePresence>
                {filtered.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }} exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      {e.note && <p className="text-xs text-muted-foreground truncate">{e.note}</p>}
                    </div>
                    <p className={`text-sm font-mono-nums font-semibold ${e.type === "income" ? "text-positive" : "text-foreground"}`}>
                      {e.type === "income" ? "+" : "−"}{formatCurrency(e.amount)}
                    </p>
                    <Badge category={e.category} />
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(e); setShowForm(true); }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && <ExpenseForm onClose={() => { setShowForm(false); setEditing(null); }} initial={editing} />}
      </AnimatePresence>
    </div>
  );
}
