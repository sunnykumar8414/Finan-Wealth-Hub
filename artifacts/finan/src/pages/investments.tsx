import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { TopBar } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListInvestments, useCreateInvestment, useDeleteInvestment, useGetPortfolioPerformance,
  getListInvestmentsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/format";

const TYPES = ["stock", "etf", "crypto", "bond", "mutual_fund"];
const TYPE_LABELS: Record<string, string> = {
  stock: "Stock", etf: "ETF", crypto: "Crypto", bond: "Bond", mutual_fund: "Mutual Fund"
};
const TYPE_COLORS: Record<string, string> = {
  stock: "#6366f1", etf: "#06b6d4", crypto: "#f59e0b", bond: "#10b981", mutual_fund: "#8b5cf6"
};

function InvestmentForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateInvestment();
  const [form, setForm] = useState({
    name: "", ticker: "", shares: "", purchasePrice: "", currentPrice: "",
    type: "stock" as any, sector: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      data: {
        ...form,
        shares: parseFloat(form.shares),
        purchasePrice: parseFloat(form.purchasePrice),
        currentPrice: parseFloat(form.currentPrice),
      }
    });
    qc.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
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
          <h2 className="text-base font-semibold">Add Investment</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <input className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Apple Inc." required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ticker</span>
              <input className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors font-mono-nums"
                value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="AAPL" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <select className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Shares</span>
              <input type="number" step="0.000001" min="0" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors font-mono-nums"
                value={form.shares} onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))} placeholder="10" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Sector</span>
              <input className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder="Technology" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Buy Price</span>
              <input type="number" step="0.01" min="0" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors font-mono-nums"
                value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} placeholder="165.00" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Current Price</span>
              <input type="number" step="0.01" min="0" className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors font-mono-nums"
                value={form.currentPrice} onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))} placeholder="190.00" required />
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {createMutation.isPending ? "Adding..." : "Add Investment"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-muted-foreground mb-0.5">{label}</p>
        <p className="font-mono-nums font-semibold text-foreground">{formatCurrency(payload[0].value, true)}</p>
      </div>
    );
  }
  return null;
};

export default function Investments() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data: investments, isLoading } = useListInvestments();
  const { data: portfolio } = useGetPortfolioPerformance();
  const deleteMutation = useDeleteInvestment();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
  };

  const totalValue = portfolio?.totalValue ?? 0;
  const totalGain = portfolio?.totalGain ?? 0;
  const totalGainPercent = portfolio?.totalGainPercent ?? 0;

  return (
    <div>
      <TopBar title="Investments" subtitle="Portfolio overview and holdings" />
      <div className="px-8 py-6 space-y-5">

        {/* Portfolio stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio Value</p>
            <p className="text-3xl font-mono-nums font-bold text-foreground">{formatCurrency(totalValue, true)}</p>
            <div className={`flex items-center gap-1 ${totalGain >= 0 ? "text-positive" : "text-negative"}`}>
              {totalGain >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span className="text-xs font-medium font-mono-nums">{formatCurrency(Math.abs(totalGain), true)} ({formatPercent(Math.abs(totalGainPercent), false)})</span>
            </div>
          </div>

          {/* Performance chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold text-foreground mb-3">Portfolio Performance</p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={portfolio?.history ?? []} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243,75%,64%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(243,75%,64%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "hsl(220,10%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<LineTooltip />} />
                <Area type="monotone" dataKey="value" stroke="hsl(243,75%,64%)" strokeWidth={2}
                  fill="url(#perfGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation + Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Allocation */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold text-foreground mb-3">Allocation</p>
            {portfolio?.allocation?.length ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={portfolio.allocation} dataKey="value" cx="50%" cy="50%"
                      innerRadius={32} outerRadius={50} paddingAngle={2}>
                      {portfolio.allocation.map((a, i) => (
                        <Cell key={i} fill={a.color} stroke="transparent" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {portfolio.allocation.map((a) => (
                    <div key={a.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="text-xs text-muted-foreground">{TYPE_LABELS[a.type] ?? a.type}</span>
                      </div>
                      <span className="text-xs font-mono-nums font-medium text-foreground">{a.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">No holdings</div>}
          </div>

          {/* Holdings table */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Holdings</p>
              <button onClick={() => setShowForm(true)}
                className="h-7 px-2.5 flex items-center gap-1 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-3 w-3" />Add
              </button>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 border-b border-border bg-muted/30">
              {["", "Name", "Shares", "Value", "Gain/Loss", ""].map((h, i) => (
                <p key={i} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</p>
              ))}
            </div>
            {isLoading ? (
              <div className="divide-y divide-border">{Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5"><Skeleton className="h-4 w-full" /></div>
              ))}</div>
            ) : (investments ?? []).length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No holdings yet</div>
            ) : (
              <div className="divide-y divide-border/60">
                {(investments ?? []).map((inv, i) => {
                  const value = inv.shares * inv.currentPrice;
                  const cost = inv.shares * inv.purchasePrice;
                  const gain = value - cost;
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                  const color = TYPE_COLORS[inv.type] ?? "#94a3b8";
                  return (
                    <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: `${color}18`, color }}>
                        {inv.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}18`, color }}>
                            {TYPE_LABELS[inv.type]}
                          </span>
                          {inv.sector && <span className="text-xs text-muted-foreground">{inv.sector}</span>}
                        </div>
                      </div>
                      <p className="text-sm font-mono-nums text-muted-foreground">{inv.shares}</p>
                      <p className="text-sm font-mono-nums font-semibold text-foreground">{formatCurrency(value, true)}</p>
                      <div className={`flex items-center gap-1 ${gain >= 0 ? "text-positive" : "text-negative"}`}>
                        {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="text-xs font-mono-nums font-medium">{formatPercent(Math.abs(gainPct), false)}</span>
                      </div>
                      <button onClick={() => handleDelete(inv.id)} disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && <InvestmentForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
