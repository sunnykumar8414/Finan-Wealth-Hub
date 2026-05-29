import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, TrendingUp, PieChart, History, Wallet, Bell } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Receipt, label: "Expenses", href: "/expenses" },
  { icon: TrendingUp, label: "Investments", href: "/investments" },
  { icon: PieChart, label: "Budgets", href: "/budgets" },
  { icon: History, label: "Transactions", href: "/transactions" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-60 border-r border-border bg-sidebar h-screen flex flex-col hidden md:flex sticky top-0 shrink-0">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">FINAN</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Menu</p>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                  />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={`h-4 w-4 relative z-10 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="text-sm font-medium relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@finan.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
