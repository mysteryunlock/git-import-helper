import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import {
  CATEGORIES,
  type Category,
  createField,
  deleteField,
  fetchFields,
  updateFieldActive,
  updateFieldName,
} from "@/lib/emi-data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Field Settings — EMI Form Builder" },
      {
        name: "description",
        content: "Add, rename, hide, or remove fields used by the dynamic entry form.",
      },
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

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Personal");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const toggle = async (id: string, value: boolean) => {
    qc.setQueryData(["fields"], (old: typeof fields | undefined) =>
      (old ?? []).map((f) => (f.id === id ? { ...f, is_active: value } : f)),
    );
    try {
      await updateFieldActive(id, value);
    } catch (e) {
      toast.error((e as Error).message);
      qc.invalidateQueries({ queryKey: ["fields"] });
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }
    const id = editingId;
    qc.setQueryData(["fields"], (old: typeof fields | undefined) =>
      (old ?? []).map((f) => (f.id === id ? { ...f, field_name: name } : f)),
    );
    setEditingId(null);
    try {
      await updateFieldName(id, name);
      toast.success("Field renamed");
    } catch (e) {
      toast.error((e as Error).message);
      qc.invalidateQueries({ queryKey: ["fields"] });
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter a field name");
      return;
    }
    setCreating(true);
    try {
      await createField({ field_name: name, category: newCategory });
      toast.success("Field added");
      setNewName("");
      setNewCategory("Personal");
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["fields"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    qc.setQueryData(["fields"], (old: typeof fields | undefined) =>
      (old ?? []).filter((f) => f.id !== id),
    );
    try {
      await deleteField(id);
      toast.success("Field deleted");
    } catch (e) {
      toast.error((e as Error).message);
      qc.invalidateQueries({ queryKey: ["fields"] });
    }
  };

  return (
    <AppShell title="Field Settings">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Add, rename, hide, or remove fields. Changes apply to the Entry form instantly.
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="mr-1 h-4 w-4" /> Add field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new field</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-field-name">Field name</Label>
                <Input
                  id="new-field-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Phone Number"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select
                  value={newCategory}
                  onValueChange={(v) => setNewCategory(v as Category)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={creating}>
                {creating ? "Adding…" : "Add field"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
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
                    {catFields.map((f) => {
                      const editing = editingId === f.id;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 p-4"
                        >
                          <div className="min-w-0 flex-1">
                            {editing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit();
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  autoFocus
                                  className="h-9"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 shrink-0"
                                  onClick={saveEdit}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="truncate text-sm font-medium">{f.field_name}</p>
                                <p className="text-xs text-muted-foreground">{f.field_key}</p>
                              </>
                            )}
                          </div>
                          {!editing && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => startEdit(f.id, f.field_name)}
                                aria-label="Rename"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteTarget({ id: f.id, name: f.field_name })
                                }
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Switch
                                checked={f.is_active}
                                onCheckedChange={(v) => toggle(f.id, v)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the field from the Entry form. Existing records keep any
              previously saved value for this field.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
