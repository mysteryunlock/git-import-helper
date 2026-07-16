import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { FieldDefinition } from "@/lib/emi-data";

interface Props {
  fields: FieldDefinition[];
  onApply: (values: Record<string, string>) => void;
}

interface Extracted {
  name?: string;
  citizenshipNo?: string;
  dob?: string;
  rawText: string;
}

/**
 * OCR a photo of an ID / Citizenship card and suggest values for
 * Name, Citizenship No, and Date of Birth.
 */
export function AutoScanId({ fields, onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Extracted | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const text = data.text || "";
      const extracted = extractFields(text);
      setResult(extracted);
      if (!extracted.name && !extracted.citizenshipNo && !extracted.dob) {
        toast.error("Couldn't detect fields. Try a clearer photo.");
      }
    } catch (e) {
      toast.error("OCR failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const values: Record<string, string> = {};
    const nameKey = findKey(fields, ["full_name", "name"], ["name"]);
    const citKey = findKey(
      fields,
      ["citizenship_no", "citizenship", "citizen"],
      ["citizen"],
    );
    const dobKey = findKey(fields, ["dob", "date_of_birth"], ["birth", "dob"]);

    const filled: string[] = [];
    if (result.name && nameKey) {
      values[nameKey] = result.name;
      filled.push("Name");
    }
    if (result.citizenshipNo && citKey) {
      values[citKey] = result.citizenshipNo;
      filled.push("Citizenship No");
    }
    if (result.dob && dobKey) {
      values[dobKey] = result.dob;
      filled.push("Date of Birth");
    }
    if (filled.length === 0) {
      toast.error("No matching fields in your form. Add them in Settings.");
      return;
    }
    onApply(values);
    toast.success(`Filled: ${filled.join(", ")}`);
    setResult(null);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        onClick={pick}
        disabled={busy}
        className="mb-3 h-12 w-full justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning… {progress}%
          </>
        ) : (
          <>
            <ScanLine className="h-4 w-4" />
            Auto-scan ID / Citizenship
          </>
        )}
      </Button>

      {result && (
        <Card className="mb-3 border-primary/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Detected values</h3>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-muted-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-1 text-sm">
              <Row label="Name" value={result.name} />
              <Row label="Citizenship No" value={result.citizenshipNo} />
              <Row label="Date of Birth" value={result.dob} />
            </dl>
            <div className="flex gap-2">
              <Button className="h-10 flex-1" onClick={apply}>
                Apply to form
              </Button>
              <Button
                variant="outline"
                className="h-10"
                onClick={() => setResult(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value || "—"}</dd>
    </div>
  );
}

function findKey(
  fields: FieldDefinition[],
  exactKeys: string[],
  nameSubstrings: string[],
): string | undefined {
  for (const k of exactKeys) {
    const f = fields.find((x) => x.field_key.toLowerCase() === k);
    if (f) return f.field_key;
  }
  for (const sub of nameSubstrings) {
    const f = fields.find(
      (x) =>
        x.field_name.toLowerCase().includes(sub) ||
        x.field_key.toLowerCase().includes(sub),
    );
    if (f) return f.field_key;
  }
  return undefined;
}

function extractFields(raw: string): Extracted {
  const text = raw.replace(/[^\S\n]+/g, " ");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // DOB: match dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, "1990/05/12", etc.
  let dob: string | undefined;
  const dobMatch =
    text.match(
      /(?:D\.?O\.?B\.?|Date\s*of\s*Birth|Birth)\D{0,10}([0-3]?\d[\/\-.\s][0-1]?\d[\/\-.\s](?:19|20)\d{2})/i,
    ) ||
    text.match(/\b([0-3]?\d[\/\-.\s][0-1]?\d[\/\-.\s](?:19|20)\d{2})\b/) ||
    text.match(/\b((?:19|20)\d{2}[\/\-.\s][0-1]?\d[\/\-.\s][0-3]?\d)\b/);
  if (dobMatch) dob = dobMatch[1].replace(/\s+/g, "/").replace(/[.-]/g, "/");

  // Citizenship No: digits with optional dashes/slashes, common Nepali format e.g. 12-34-56-78901
  let citizenshipNo: string | undefined;
  const citLabelled = text.match(
    /(?:Citizenship(?:\s*(?:No|Number|Certificate))?|Cert(?:ificate)?\s*No)\D{0,15}([\d][\d\-\/\s]{5,25}\d)/i,
  );
  if (citLabelled) {
    citizenshipNo = citLabelled[1].trim().replace(/\s+/g, "");
  } else {
    const generic = text.match(/\b(\d{2,4}[-\/]\d{2,4}[-\/]\d{2,6}(?:[-\/]\d{2,6})?)\b/);
    if (generic) citizenshipNo = generic[1];
  }

  // Name: try label "Name" first, else pick a plausible ALL-CAPS line
  let name: string | undefined;
  const nameLabel = raw.match(
    /(?:Full\s*Name|Name)\s*[:\-]?\s*([A-Z][A-Za-z .'-]{2,60})/,
  );
  if (nameLabel) {
    name = cleanName(nameLabel[1]);
  } else {
    const capsLine = lines.find(
      (l) =>
        /^[A-Z][A-Z .'-]{4,60}$/.test(l) &&
        !/CITIZEN|GOVERNMENT|REPUBLIC|NEPAL|INDIA|CERTIFICATE|BIRTH|DATE|NUMBER/i.test(
          l,
        ),
    );
    if (capsLine) name = cleanName(capsLine);
  }

  return { name, citizenshipNo, dob, rawText: raw };
}

function cleanName(s: string): string {
  return s
    .replace(/[^A-Za-z .'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
