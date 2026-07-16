import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFieldsTool from "./tools/list-fields";
import addFieldTool from "./tools/add-field";
import deleteFieldTool from "./tools/delete-field";
import listRecordsTool from "./tools/list-records";
import createRecordTool from "./tools/create-record";

// Direct Supabase issuer (not the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "emi-form-builder-mcp",
  title: "EMI Form Builder",
  version: "0.1.0",
  instructions:
    "Tools for the EMI Form Builder app. Use `list_fields` and `add_field`/`delete_field` to manage the dynamic form schema for the signed-in user, and `list_records`/`create_record` to read and add captured records. Record `data` is a JSON object keyed by each field's `field_key`.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listFieldsTool, addFieldTool, deleteFieldTool, listRecordsTool, createRecordTool],
});
