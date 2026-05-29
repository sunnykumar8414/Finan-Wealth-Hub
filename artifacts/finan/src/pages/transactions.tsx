import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, X, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { TopBar } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#6366f1", Food: "#06b6d4", Transport: "#f59e0b", Entertainment: "#10b981",
  Health: "#ef4444", Utilities: "#8b5cf6", Shopping: "#f97316", Travel: "#14b8a6",
  Income: "#22c55e", Investment: "#6366f1", Other: "#94a3b8",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-positive/10 text-positive">
      <CheckCircle2 className="h-2.5 w-2.5" />Completed
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-yellow-500/10 text-yellow-400">
      <Clock className="h-2.5 w-2.5" />Pending
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-destructive/10 text-destructive">
      <XCircle className="h-2.5 w-2.5" />Failed
    </span>
  );
}

export default function Transactions() {
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const { data: transactions, isLoading } = useListTransactions();

  const filtered = (transactions ?? []).filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  const totalCredit = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const allCategories = [...new Set((transactions ?? []).map((t) => t.category))].sort();

  return (
    <div>
      <TopBar title="Transactions" subtitle="Full history of your financial activity" />
      <div className="px-8 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-positive/15 flex items-center justify-center">
              <ArrowUpRight className="h-4.5 w-4.5 text-positive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-mono-nums font-bold text-positive">+{formatCurrency(totalCredit, true)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-destructive/15 flex items-center justify-center">
              <ArrowDownRight className="h-4.5 w-4.5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Debits</p>
              <p className="text-lg font-mono-nums font-bold text-foreground">−{formatCurrency(totalDebit, true)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          <select className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary"
            value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary"
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select className="h-8 px-2.5 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary"
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
          {(filterType || filterStatus || filterCategory) && (
            <button onClick={() => { setFilterType(""); setFilterStatus(""); setFilterCategory(""); }}
              className="h-8 px-2.5 flex items-center gap-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
              <X className="h-3 w-3" />Clear
            </button>
          )}
          <p className="ml-auto text-xs text-muted-foreground">{filtered.length} transactions</p>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-5 px-5 py-3 border-b border-border bg-muted/30">
            {["", "Transaction", "Amount", "Status", "Date"].map((h, i) => (
              <p key={i} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</p>
            ))}
          </div>
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-5 px-5 py-3.5 items-center">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No transactions found</div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((tx, i) => {
                const catColor = CATEGORY_COLORS[tx.category] ?? "#94a3b8";
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-5 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === "credit" ? "bg-positive/15" : "bg-primary/10"
                    }`}>
                      {tx.type === "credit"
                        ? <ArrowUpRight className="h-4 w-4 text-positive" />
                        : <ArrowDownRight className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.title}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] mt-0.5 font-medium px-1.5 py-0.5 rounded"
                        style={{ color: catColor, backgroundColor: `${catColor}15` }}>
                        {tx.category}
                      </span>
                    </div>
                    <p className={`text-sm font-mono-nums font-semibold ${tx.type === "credit" ? "text-positive" : "text-foreground"}`}>
                      {tx.type === "credit" ? "+" : "−"}{formatCurrency(tx.amount)}
                    </p>
                    <StatusBadge status={tx.status} />
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
