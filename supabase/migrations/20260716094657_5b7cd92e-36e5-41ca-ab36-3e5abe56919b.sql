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
    (NEW.id, 'Citizenship Number', 'citizenship_no', 'Document', 39, NULL),
    (NEW.id, 'PAN Number', 'pan', 'Document', 40, NULL),
    (NEW.id, 'Aadhaar Number', 'aadhaar', 'Document', 41, NULL),
    (NEW.id, 'Voter ID', 'voter_id', 'Document', 42, NULL);
  RETURN NEW;
END;
$$;