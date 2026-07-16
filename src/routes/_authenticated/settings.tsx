import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CATEGORIES, fetchFields, updateFieldActive } from "@/lib/emi-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EMI Form Builder" },
      { name: "description", content: "Show or hide any form field with a toggle." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: fetchFields,
  });

  const toggle = async (id: string, value: boolean) => {
    // Optimistic
    qc.setQueryData(["fields"], (old: typeof fields | undefined) =>
      (old ?? []).map((f) => (f.id === id ? { ...f, is_active: value } : f)),
    );
    try {
      await updateFieldActive(id, value);
      toast.success(value ? "Field enabled" : "Field hidden", { position: "bottom-center" });
    } catch (e) {
      toast.error((e as Error).message);
      qc.invalidateQueries({ queryKey: ["fields"] });
    }
  };

  return (
    <AppShell title="Field Settings">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Toggle any field to hide or show it in the Entry form. Changes apply instantly.
          </p>
          {CATEGORIES.map((cat) => {
            const catFields = fields.filter((f) => f.category === cat);
            if (catFields.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </p>
                <Card>
                  <CardContent className="divide-y p-0">
                    {catFields.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{f.field_name}</p>
                          <p className="text-xs text-muted-foreground">{f.field_key}</p>
                        </div>
                        <Switch
                          checked={f.is_active}
                          onCheckedChange={(v) => toggle(f.id, v)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
