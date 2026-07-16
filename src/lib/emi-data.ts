import { supabase } from "@/integrations/supabase/client";

export type Category = "Personal" | "Family" | "Contact" | "Address" | "Document";
export const CATEGORIES: Category[] = ["Personal", "Family", "Contact", "Address", "Document"];

export interface FieldDefinition {
  id: string;
  field_name: string;
  field_key: string;
  category: Category;
  is_active: boolean;
  order_index: number;
  address_role: "permanent" | "current" | null;
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
