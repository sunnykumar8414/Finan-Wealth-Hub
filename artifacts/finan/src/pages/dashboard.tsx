import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Briefcase, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Wallet, CreditCard
} from "lucide-react";
import { TopBar } from "@/components/layout";
import { useGetDashboardSummary, useGetMonthlyTrend, useGetSpendingByCategory, useListTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" } }),
};

function StatCard({ title, value, sub, icon: Icon, trend, trendValue, loading, index }: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  trend?: "up" | "down" | "neutral"; trendValue?: string; loading?: boolean; index: number;
}) {
  return (
    <motion.div variants={cardVariants} custom={index} initial="hidden" animate="visible"
      className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold font-mono-nums text-foreground tracking-tight">{value}</p>
          {(sub || trendValue) && (
            <div className="flex items-center gap-1.5">
              {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-positive" />}
              {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-negative" />}
              {trendValue && (
                <span className={`text-xs font-medium ${trend === "up" ? "text-positive" : trend === "down" ? "text-negative" : "text-muted-foreground"}`}>
                  {trendValue}
                </span>
              )}
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-mono-nums">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="font-mono-nums text-primary">{formatCurrency(payload[0].value)}</p>
        <p className="text-muted-foreground">{payload[0].payload.percent?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: trend, isLoading: trendLoading } = useGetMonthlyTrend();
  const { data: spending, isLoading: spendingLoading } = useGetSpendingByCategory();
  const { data: transactions } = useListTransactions({ limit: 5 });

  const savingsRate = summary?.savingsRate ?? 0;

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle={`Good morning, John — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
      />
      <div className="px-8 py-6 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard index={0} title="Net Balance" icon={Wallet} loading={summaryLoading}
            value={formatCurrency(summary?.totalBalance ?? 0, true)}
            trend={summary?.monthlyChange != null ? (summary.monthlyChange >= 0 ? "up" : "down") : undefined}
            trendValue={summary ? `${formatPercent(Math.abs(summary.monthlyChange), false)} vs last month` : undefined}
          />
          <StatCard index={1} title="Monthly Income" icon={ArrowUpRight} loading={summaryLoading}
            value={formatCurrency(summary?.totalIncome ?? 0, true)}
            sub="this month"
          />
          <StatCard index={2} title="Monthly Expenses" icon={CreditCard} loading={summaryLoading}
            value={formatCurrency(summary?.totalExpenses ?? 0, true)}
            sub="this month"
          />
          <StatCard index={3} title="Portfolio Value" icon={Briefcase} loading={summaryLoading}
            value={formatCurrency(summary?.totalInvestments ?? 0, true)}
            trend={summary?.investmentGainPercent != null ? (summary.investmentGainPercent >= 0 ? "up" : "down") : undefined}
            trendValue={summary ? formatPercent(summary.investmentGainPercent, true) : undefined}
          />
        </div>

        {/* Savings rate + Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly trend chart */}
          <motion.div variants={cardVariants} custom={4} initial="hidden" animate="visible"
            className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Income vs Expenses</p>
                <p className="text-xs text-muted-foreground mt-0.5">6-month trend</p>
              </div>
            </div>
            {trendLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243,75%,64%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(243,75%,64%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(188,85%,45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(188,85%,45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="hsl(243,75%,64%)" strokeWidth={2}
                    fill="url(#colorIncome)" dot={false} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(188,85%,45%)" strokeWidth={2}
                    fill="url(#colorExpenses)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Spending by category */}
          <motion.div variants={cardVariants} custom={5} initial="hidden" animate="visible"
            className="bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Spending</p>
              <p className="text-xs text-muted-foreground mt-0.5">By category this month</p>
            </div>
            {spendingLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : spending && spending.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={spending} dataKey="amount" nameKey="category" cx="50%" cy="50%"
                      innerRadius={40} outerRadius={60} paddingAngle={2}>
                      {spending.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {(spending ?? []).slice(0, 4).map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                      <span className="text-xs font-mono-nums font-medium text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </motion.div>
        </div>

        {/* Bottom row: Savings + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Savings rate */}
          <motion.div variants={cardVariants} custom={6} initial="hidden" animate="visible"
            className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-positive/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Savings Rate</p>
                <p className="text-xs text-muted-foreground">of monthly income saved</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold font-mono-nums text-foreground">{summaryLoading ? "..." : formatPercent(savingsRate)}</p>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-sm font-mono-nums font-semibold text-positive">
                  {summaryLoading ? "..." : formatCurrency(Math.max(0, (summary?.totalIncome ?? 0) - (summary?.totalExpenses ?? 0)), true)}
                </p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                <p className="text-sm font-mono-nums font-semibold text-foreground">{formatCurrency(summary?.totalIncome ?? 0, true)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Investment Gain</p>
                <p className={`text-sm font-mono-nums font-semibold ${(summary?.investmentGain ?? 0) >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatCurrency(summary?.investmentGain ?? 0, true)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent transactions */}
          <motion.div variants={cardVariants} custom={7} initial="hidden" animate="visible"
            className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
                <p className="text-xs text-muted-foreground mt-0.5">Latest activity</p>
              </div>
              <a href="/transactions" className="text-xs text-primary hover:underline font-medium">View all</a>
            </div>
            <div className="space-y-3">
              {transactions?.slice(0, 5).map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      tx.type === "credit" ? "bg-positive/15 text-positive" : "bg-primary/10 text-primary"
                    }`}>
                      {tx.type === "credit" ? "+" : "−"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.category} · {formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono-nums font-semibold ${tx.type === "credit" ? "text-positive" : "text-foreground"}`}>
                      {tx.type === "credit" ? "+" : "−"}{formatCurrency(tx.amount)}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      tx.status === "completed" ? "bg-positive/10 text-positive" :
                      tx.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-destructive/10 text-destructive"
                    }`}>{tx.status}</span>
                  </div>
                </motion.div>
              ))}
              {!transactions?.length && (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
