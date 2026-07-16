import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  CATEGORIES,
  type Category,
  createRecord,
  fetchFields,
  type FieldDefinition,
} from "@/lib/emi-data";
import { cn } from "@/lib/utils";
import { AutoScanId } from "@/components/AutoScanId";

export const Route = createFileRoute("/_authenticated/entry")({
  head: () => ({
    meta: [
      { title: "New Entry — EMI Form Builder" },
      { name: "description", content: "Capture a new record using the dynamic multi-step form." },
    ],
  }),
  component: EntryPage,
});

function EntryPage() {
  const navigate = useNavigate();
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: fetchFields,
  });

  const active = useMemo(() => fields.filter((f) => f.is_active), [fields]);
  const categoriesWithFields = useMemo(
    () => CATEGORIES.filter((c) => active.some((f) => f.category === c)),
    [active],
  );

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentCategory: Category | undefined = categoriesWithFields[step];
  const stepFields = active.filter((f) => f.category === currentCategory);

  const setValue = (key: string, val: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (currentCategory === "Address" && sameAsPermanent) {
        // If user edits permanent while checkbox is on, mirror to current
        const permField = active.find((f) => f.field_key === key && f.address_role === "permanent");
        if (permField) {
          const currField = active.find(
            (f) => f.address_role === "current" && sameSlot(f, permField),
          );
          if (currField) next[currField.field_key] = val;
        }
      }
      return next;
    });
  };

  const toggleSameAsPermanent = (checked: boolean) => {
    setSameAsPermanent(checked);
    if (checked) {
      setValues((prev) => {
        const next = { ...prev };
        for (const curr of active.filter((f) => f.address_role === "current")) {
          const perm = active.find((f) => f.address_role === "permanent" && sameSlot(f, curr));
          if (perm) next[curr.field_key] = prev[perm.field_key] ?? "";
        }
        return next;
      });
    }
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      await createRecord(values);
      toast.success("Record saved");
      navigate({ to: "/records" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="New Entry">
        <p className="text-sm text-muted-foreground">Loading fields…</p>
      </AppShell>
    );
  }

  if (categoriesWithFields.length === 0) {
    return (
      <AppShell title="New Entry">
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No active fields. Enable some in Settings first.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const isLast = step === categoriesWithFields.length - 1;

  return (
    <AppShell title="New Entry">
      {/* Stepper */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {categoriesWithFields.map((c, i) => (
          <div key={c} className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                i < step && "bg-primary text-primary-foreground",
                i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-medium",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {c}
            </span>
            {i < categoriesWithFields.length - 1 && (
              <div className="h-px w-4 shrink-0 bg-border" />
            )}
          </div>
        ))}
      </div>

      <AutoScanId
        fields={active}
        onApply={(vals) =>
          setValues((prev) => ({ ...prev, ...vals }))
        }
      />

      <Card>

        <CardContent className="space-y-4 p-4">
          <h2 className="text-base font-semibold">{currentCategory} details</h2>

          {currentCategory === "Address" &&
            active.some((f) => f.address_role === "current") &&
            active.some((f) => f.address_role === "permanent") && (
              <label className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <Checkbox
                  checked={sameAsPermanent}
                  onCheckedChange={(v) => toggleSameAsPermanent(!!v)}
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium">
                  Current address same as Permanent
                </span>
              </label>
            )}

          <div className="space-y-3">
            {stepFields.map((f) => {
              const isCurrent = f.address_role === "current";
              const disabled = isCurrent && sameAsPermanent;
              const isSelect = f.field_type === "select" && (f.options?.length ?? 0) > 0;
              return (
                <div key={f.id} className="space-y-1.5">
                  <Label htmlFor={f.field_key} className="text-sm">
                    {f.field_name}
                  </Label>
                  {isSelect ? (
                    <select
                      id={f.field_key}
                      value={values[f.field_key] ?? ""}
                      onChange={(e) => setValue(f.field_key, e.target.value)}
                      disabled={disabled}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select {f.field_name.toLowerCase()}…</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={f.field_key}
                      value={values[f.field_key] ?? ""}
                      onChange={(e) => setValue(f.field_key, e.target.value)}
                      disabled={disabled}
                      inputMode={inputModeFor(f.field_key)}
                      className="h-12 text-base"
                      placeholder={`Enter ${f.field_name.toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          className="h-12 flex-1"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <Button className="h-12 flex-1" disabled={saving} onClick={onSubmit}>
            {saving ? "Saving…" : "Save record"}
          </Button>
        ) : (
          <Button
            className="h-12 flex-1"
            onClick={() => setStep((s) => Math.min(categoriesWithFields.length - 1, s + 1))}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function sameSlot(a: FieldDefinition, b: FieldDefinition) {
  // Match "perm_city" ↔ "curr_city" etc.
  const stripA = a.field_key.replace(/^perm_|^curr_/, "");
  const stripB = b.field_key.replace(/^perm_|^curr_/, "");
  return stripA === stripB;
}

function inputModeFor(key: string): "text" | "numeric" | "email" | "tel" {
  if (key.includes("mobile")) return "tel";
  if (key.includes("email")) return "email";
  if (key.includes("pincode") || key.includes("aadhaar")) return "numeric";
  return "text";
}
