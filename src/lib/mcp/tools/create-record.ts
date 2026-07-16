import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_record",
  title: "Create record",
  description:
    "Create a new record for the signed-in user. `data` is an object keyed by field_key (see list_fields). Unknown keys are stored as-is in the JSONB column.",
  inputSchema: {
    data: z
      .record(z.string(), z.string())
      .describe("Field values keyed by field_key, e.g. { full_name: 'Ada', mobile: '555…' }."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ data }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data: row, error } = await userClient(ctx)
      .from("records")
      .insert({ user_id: ctx.getUserId(), data })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created record ${row.id}.` }],
      structuredContent: { record: row },
    };
  },
});
