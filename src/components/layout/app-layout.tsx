import { LayoutDashboard, Server } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminKeyDialog } from "@/components/admin-key-dialog";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "History", icon: LayoutDashboard },
  { to: "/details", label: "Details", icon: Server },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Server className="h-6 w-6" />
          <span className="text-lg font-bold">Test Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-4">
          <p className="text-xs text-muted-foreground">© 2025 Salad x Golem</p>
          <div className="flex items-center gap-1">
            <AdminKeyDialog />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
