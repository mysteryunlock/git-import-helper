import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || `field_${Date.now()}`
  );
}

export default defineTool({
  name: "add_field",
  title: "Add field",
  description:
    "Add a new field definition for the signed-in user. The field appears in the entry form under the given section.",
  inputSchema: {
    field_name: z.string().min(1).describe("Human-readable label, e.g. 'Phone Number'."),
    category: z
      .enum(["Personal", "Family", "Contact", "Address", "Document"])
      .describe("Section/tab the field belongs to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ field_name, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = userClient(ctx);
    const userId = ctx.getUserId();

    const { data: existing, error: exErr } = await supabase
      .from("field_definitions")
      .select("field_key, order_index")
      .eq("user_id", userId);
    if (exErr) return { content: [{ type: "text", text: exErr.message }], isError: true };

    const keys = new Set(((existing ?? []) as { field_key: string }[]).map((r) => r.field_key));
    const base = slugify(field_name);
    let key = base;
    let i = 2;
    while (keys.has(key)) key = `${base}_${i++}`;
    const maxOrder = ((existing ?? []) as { order_index: number }[]).reduce(
      (m, r) => Math.max(m, r.order_index ?? 0),
      0,
    );

    const { data, error } = await supabase
      .from("field_definitions")
      .insert({
        user_id: userId,
        field_name: field_name.trim(),
        field_key: key,
        category,
        order_index: maxOrder + 1,
        is_active: true,
        address_role: null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Added field '${data.field_name}' (${data.field_key}).` }],
      structuredContent: { field: data },
    };
  },
});
