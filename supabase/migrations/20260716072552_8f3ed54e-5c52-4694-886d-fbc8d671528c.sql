
CREATE TABLE public.field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Personal','Family','Contact','Address','Document')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  address_role TEXT CHECK (address_role IN ('permanent','current')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_definitions TO anon, authenticated;
GRANT ALL ON public.field_definitions TO service_role;
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read field_definitions" ON public.field_definitions FOR SELECT USING (true);
CREATE POLICY "public write field_definitions" ON public.field_definitions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO anon, authenticated;
GRANT ALL ON public.records TO service_role;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read records" ON public.records FOR SELECT USING (true);
CREATE POLICY "public write records" ON public.records FOR ALL USING (true) WITH CHECK (true);

-- Seed default fields
INSERT INTO public.field_definitions (field_name, field_key, category, order_index, address_role) VALUES
  ('Full Name', 'full_name', 'Personal', 1, NULL),
  ('Date of Birth', 'dob', 'Personal', 2, NULL),
  ('Gender', 'gender', 'Personal', 3, NULL),
  ('Marital Status', 'marital_status', 'Personal', 4, NULL),
  ('Father Name', 'father_name', 'Family', 10, NULL),
  ('Mother Name', 'mother_name', 'Family', 11, NULL),
  ('Spouse Name', 'spouse_name', 'Family', 12, NULL),
  ('Mobile Number', 'mobile', 'Contact', 20, NULL),
  ('Alternate Mobile', 'alt_mobile', 'Contact', 21, NULL),
  ('Email', 'email', 'Contact', 22, NULL),
  ('Permanent Address Line', 'perm_address', 'Address', 30, 'permanent'),
  ('Permanent City', 'perm_city', 'Address', 31, 'permanent'),
  ('Permanent State', 'perm_state', 'Address', 32, 'permanent'),
  ('Permanent Pincode', 'perm_pincode', 'Address', 33, 'permanent'),
  ('Current Address Line', 'curr_address', 'Address', 34, 'current'),
  ('Current City', 'curr_city', 'Address', 35, 'current'),
  ('Current State', 'curr_state', 'Address', 36, 'current'),
  ('Current Pincode', 'curr_pincode', 'Address', 37, 'current'),
  ('PAN Number', 'pan', 'Document', 40, NULL),
  ('Aadhaar Number', 'aadhaar', 'Document', 41, NULL),
  ('Voter ID', 'voter_id', 'Document', 42, NULL);
