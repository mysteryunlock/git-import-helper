import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutGrid, Settings as SettingsIcon, FilePlus2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/entry", label: "Entry", icon: FilePlus2 },
  { to: "/records", label: "Records", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              EMI Form Builder
            </p>
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {tabs.map((t) => {
            const active = pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
