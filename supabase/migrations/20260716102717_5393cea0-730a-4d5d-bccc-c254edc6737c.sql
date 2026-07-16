ALTER TABLE public.field_definitions
  ADD COLUMN IF NOT EXISTS field_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.field_definitions
  DROP CONSTRAINT IF EXISTS field_definitions_field_type_check;
ALTER TABLE public.field_definitions
  ADD CONSTRAINT field_definitions_field_type_check
  CHECK (field_type IN ('text','select'));