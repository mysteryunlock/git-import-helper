import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Trash2, ClipboardList } from "lucide-react";
import { CATEGORIES, deleteRecord, fetchFields, fetchRecords, type RecordRow } from "@/lib/emi-data";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "Records — EMI Form Builder" },
      { name: "description", content: "View saved records and one-tap copy any field." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const qc = useQueryClient();
  const { data: fields = [] } = useQuery({ queryKey: ["fields"], queryFn: fetchFields });
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: fetchRecords,
  });

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`, { position: "bottom-center" });
    } catch {
      toast.error("Copy failed", { position: "bottom-center" });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRecord(id);
      toast.success("Record deleted", { position: "bottom-center" });
      qc.invalidateQueries({ queryKey: ["records"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Records">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (records.length === 0) {
    return (
      <AppShell title="Records">
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No records yet. Create one from the Entry tab.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Records">
      <div className="space-y-5">
        {records.map((rec, idx) => (
          <div key={rec.id} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold">
                Record #{records.length - idx}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {new Date(rec.created_at).toLocaleString()}
                </span>
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-destructive"
                onClick={() => remove(rec.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            {CATEGORIES.map((cat) => {
              const catFields = fields.filter((f) => f.category === cat && rec.data[f.field_key]);
              if (catFields.length === 0) return null;
              return (
                <div key={cat} className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </p>
                  <div className="space-y-2">
                    {catFields.map((f) => {
                      const val = rec.data[f.field_key];
                      return (
                        <Card key={f.id}>
                          <CardContent className="flex items-center gap-3 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">{f.field_name}</p>
                              <p className="truncate text-base font-medium">{val}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 shrink-0 gap-1.5"
                              onClick={() => copy(val, f.field_name)}
                            >
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
