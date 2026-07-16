import { supabase } from "@/integrations/supabase/client";

export type Category = "Personal" | "Family" | "Contact" | "Address" | "Document";
export const CATEGORIES: Category[] = ["Personal", "Family", "Contact", "Address", "Document"];

export type FieldType = "text" | "select";

export interface FieldDefinition {
  id: string;
  field_name: string;
  field_key: string;
  category: Category;
  is_active: boolean;
  order_index: number;
  address_role: "permanent" | "current" | null;
  field_type: FieldType;
  options: string[];
  created_at: string;
}

export interface RecordRow {
  id: string;
  data: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export async function fetchFields(): Promise<FieldDefinition[]> {
  const { data, error } = await supabase
    .from("field_definitions" as never)
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FieldDefinition[];
}

export async function fetchRecords(): Promise<RecordRow[]> {
  const { data, error } = await supabase
    .from("records" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RecordRow[];
}

export async function createRecord(data: Record<string, string>) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("records" as never)
    .insert({ data, user_id: userData.user.id } as never);
  if (error) throw error;
}

export async function updateFieldActive(id: string, is_active: boolean) {
  const { error } = await supabase
    .from("field_definitions" as never)
    .update({ is_active } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from("records" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function updateFieldName(id: string, field_name: string) {
  const { error } = await supabase
    .from("field_definitions" as never)
    .update({ field_name } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteField(id: string) {
  const { error } = await supabase
    .from("field_definitions" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `field_${Date.now()}`;
}

export async function createField(input: {
  field_name: string;
  category: Category;
}): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");

  const base = slugify(input.field_name);
  // Ensure uniqueness per user
  const { data: existing } = await supabase
    .from("field_definitions" as never)
    .select("field_key,order_index")
    .eq("user_id", userData.user.id);
  const keys = new Set(((existing ?? []) as { field_key: string }[]).map((r) => r.field_key));
  let key = base;
  let i = 2;
  while (keys.has(key)) key = `${base}_${i++}`;
  const maxOrder = ((existing ?? []) as { order_index: number }[]).reduce(
    (m, r) => Math.max(m, r.order_index ?? 0),
    0,
  );

  const { error } = await supabase.from("field_definitions" as never).insert({
    user_id: userData.user.id,
    field_name: input.field_name.trim(),
    field_key: key,
    category: input.category,
    order_index: maxOrder + 1,
    is_active: true,
    address_role: null,
  } as never);
  if (error) throw error;
}
