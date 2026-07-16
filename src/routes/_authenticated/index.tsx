import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, FilePlus2, Settings as SettingsIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "EMI Form Builder — Dynamic Records" },
      {
        name: "description",
        content:
          "Build dynamic EMI forms, capture records, and copy any field with one tap.",
      },
    ],
  }),
  component: Home,
});

const items = [
  { to: "/entry", title: "New Entry", desc: "Fill the multi-step form with active fields.", icon: FilePlus2 },
  { to: "/records", title: "View Records", desc: "Browse and one-tap copy any saved field.", icon: ClipboardList },
  { to: "/settings", title: "Field Settings", desc: "Toggle which fields appear in the form.", icon: SettingsIcon },
] as const;

function Home() {
  return (
    <AppShell title="Home">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          A private, mobile-first form builder. Only you can see and edit your fields and records.
        </p>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to}>
              <Card className="transition active:scale-[0.99] hover:border-primary/40">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{it.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{it.desc}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
