import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, Shield, Plane, LayoutDashboard, Settings, BarChart3, CreditCard, Key, Bell, Search, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Job Finder", path: "/dashboard/jobs" },
  { icon: Shield, label: "Competitive Intel", path: "/dashboard/competitive" },
  { icon: Plane, label: "Travel Planner", path: "/dashboard/travel" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
  { icon: Key, label: "API Keys", path: "/dashboard/api-keys" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex flex-col shrink-0 hidden lg:flex">
        <div className="h-16 flex items-center px-5 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-sm">24hr Engine</span>
          </Link>
        </div>

        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sm">
            <div className="h-5 w-5 rounded bg-foreground/10 flex items-center justify-center text-xs font-medium">W</div>
            <span className="font-medium text-sm">My Workspace</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-1 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">JD</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Jane Doe</p>
              <p className="text-xs text-muted-foreground truncate">jane@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/" className="lg:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 w-64 rounded-lg h-9 bg-muted border-0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-lg relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
