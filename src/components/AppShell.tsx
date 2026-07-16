import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutGrid, LogOut, Settings as SettingsIcon, FilePlus2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const tabs = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/entry", label: "Entry", icon: FilePlus2 },
  { to: "/records", label: "Records", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              EMI Form Builder
            </p>
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="shrink-0 gap-1.5">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
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
