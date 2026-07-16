
-- Drop old permissive policies and seed data
DROP POLICY IF EXISTS "public read field_definitions" ON public.field_definitions;
DROP POLICY IF EXISTS "public write field_definitions" ON public.field_definitions;
DROP POLICY IF EXISTS "public read records" ON public.records;
DROP POLICY IF EXISTS "public write records" ON public.records;

DELETE FROM public.records;
DELETE FROM public.field_definitions;

-- Add user_id ownership columns
ALTER TABLE public.field_definitions
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.records
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- field_key must be unique per user, not globally
ALTER TABLE public.field_definitions DROP CONSTRAINT IF EXISTS field_definitions_field_key_key;
ALTER TABLE public.field_definitions ADD CONSTRAINT field_definitions_user_field_key_unique UNIQUE (user_id, field_key);

CREATE INDEX IF NOT EXISTS idx_field_definitions_user ON public.field_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_records_user ON public.records(user_id);

-- Revoke anon access
REVOKE ALL ON public.field_definitions FROM anon;
REVOKE ALL ON public.records FROM anon;

-- Owner-only RLS policies
CREATE POLICY "Users manage own field_definitions"
  ON public.field_definitions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own records"
  ON public.records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for records
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_records_updated_at ON public.records;
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default field definitions for every new user
CREATE OR REPLACE FUNCTION public.seed_default_fields_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.field_definitions (user_id, field_name, field_key, category, order_index, address_role) VALUES
    (NEW.id, 'Full Name', 'full_name', 'Personal', 1, NULL),
    (NEW.id, 'Date of Birth', 'dob', 'Personal', 2, NULL),
    (NEW.id, 'Gender', 'gender', 'Personal', 3, NULL),
    (NEW.id, 'Marital Status', 'marital_status', 'Personal', 4, NULL),
    (NEW.id, 'Father Name', 'father_name', 'Family', 10, NULL),
    (NEW.id, 'Mother Name', 'mother_name', 'Family', 11, NULL),
    (NEW.id, 'Spouse Name', 'spouse_name', 'Family', 12, NULL),
    (NEW.id, 'Mobile Number', 'mobile', 'Contact', 20, NULL),
    (NEW.id, 'Alternate Mobile', 'alt_mobile', 'Contact', 21, NULL),
    (NEW.id, 'Email', 'email', 'Contact', 22, NULL),
    (NEW.id, 'Permanent Address Line', 'perm_address', 'Address', 30, 'permanent'),
    (NEW.id, 'Permanent City', 'perm_city', 'Address', 31, 'permanent'),
    (NEW.id, 'Permanent State', 'perm_state', 'Address', 32, 'permanent'),
    (NEW.id, 'Permanent Pincode', 'perm_pincode', 'Address', 33, 'permanent'),
    (NEW.id, 'Current Address Line', 'curr_address', 'Address', 34, 'current'),
    (NEW.id, 'Current City', 'curr_city', 'Address', 35, 'current'),
    (NEW.id, 'Current State', 'curr_state', 'Address', 36, 'current'),
    (NEW.id, 'Current Pincode', 'curr_pincode', 'Address', 37, 'current'),
    (NEW.id, 'PAN Number', 'pan', 'Document', 40, NULL),
    (NEW.id, 'Aadhaar Number', 'aadhaar', 'Document', 41, NULL),
    (NEW.id, 'Voter ID', 'voter_id', 'Document', 42, NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seed_fields ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_fields
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_fields_for_user();
