import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  CATEGORIES,
  type Category,
  type FieldDefinition,
  type FieldType,
  createField,
  deleteField,
  fetchFields,
  updateFieldActive,
  updateFieldName,
  updateFieldTypeAndOptions,
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

function parseOptions(text: string): string[] {
  return text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function SettingsPage() {
  const qc = useQueryClient();
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: fetchFields,
  });

  // Add
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Personal");
  const [newType, setNewType] = useState<FieldType>("text");
  const [newOptions, setNewOptions] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [editField, setEditField] = useState<FieldDefinition | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<FieldType>("text");
  const [editOptions, setEditOptions] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEdit = (f: FieldDefinition) => {
    setEditField(f);
    setEditName(f.field_name);
    setEditType(f.field_type);
    setEditOptions((f.options ?? []).join("\n"));
  };

  const saveEdit = async () => {
    if (!editField) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }
    const opts = parseOptions(editOptions);
    if (editType === "select" && opts.length === 0) {
      toast.error("Add at least one dropdown option");
      return;
    }
    setSavingEdit(true);
    try {
      if (name !== editField.field_name) {
        await updateFieldName(editField.id, name);
      }
      if (
        editType !== editField.field_type ||
        JSON.stringify(opts) !== JSON.stringify(editField.options ?? [])
      ) {
        await updateFieldTypeAndOptions(editField.id, editType, opts);
      }
      toast.success("Field updated");
      setEditField(null);
      qc.invalidateQueries({ queryKey: ["fields"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter a field name");
      return;
    }
    const opts = parseOptions(newOptions);
    if (newType === "select" && opts.length === 0) {
      toast.error("Add at least one dropdown option");
      return;
    }
    setCreating(true);
    try {
      await createField({
        field_name: name,
        category: newCategory,
        field_type: newType,
        options: opts,
      });
      toast.success("Field added");
      setNewName("");
      setNewCategory("Personal");
      setNewType("text");
      setNewOptions("");
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
              <div className="space-y-1.5">
                <Label>Field type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as FieldType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text input</SelectItem>
                    <SelectItem value="select">Dropdown / Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newType === "select" && (
                <div className="space-y-1.5">
                  <Label htmlFor="new-field-options">Options</Label>
                  <Textarea
                    id="new-field-options"
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    placeholder={"One per line, e.g.\nMale\nFemale\nOther"}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    One option per line. Commas also work.
                  </p>
                </div>
              )}
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
                    {catFields.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{f.field_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.field_key} ·{" "}
                            {f.field_type === "select"
                              ? `Dropdown (${f.options?.length ?? 0})`
                              : "Text"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            onClick={() => openEdit(f)}
                            aria-label="Edit"
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
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editField} onOpenChange={(o) => !o && setEditField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit field</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-field-name">Field name</Label>
              <Input
                id="edit-field-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Field type</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as FieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text input</SelectItem>
                  <SelectItem value="select">Dropdown / Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editType === "select" && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-field-options">Options</Label>
                <Textarea
                  id="edit-field-options"
                  value={editOptions}
                  onChange={(e) => setEditOptions(e.target.value)}
                  placeholder={"One per line, e.g.\nMale\nFemale\nOther"}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  One option per line. Commas also work.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditField(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
