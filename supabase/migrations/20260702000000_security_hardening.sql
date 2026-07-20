-- SECURITY HARDENING MIGRATION
-- This script secures profiles, vendor_settings, and orders tables against direct client-side bypasses and exploits.

-- 1. Ensure Default Order Status is 'pending' (instead of 'paid')
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending'::text;

-- 2. Prevent role escalation in profiles
CREATE OR REPLACE FUNCTION public.check_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-admins from changing their role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized to modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_profile_role_change ON public.profiles;
CREATE TRIGGER tr_check_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_change();

-- 3. Prevent self-verification & commission rate tampering in vendor_settings
CREATE OR REPLACE FUNCTION public.check_vendor_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-admins from updating verification status or commission rate
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      -- Revert changes to their original database values
      NEW.is_verified := OLD.is_verified;
      NEW.commission_rate := OLD.commission_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_vendor_settings_change ON public.vendor_settings;
CREATE TRIGGER tr_check_vendor_settings_change
  BEFORE UPDATE ON public.vendor_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vendor_settings_change();

-- 4. Apply clean SELECT policy to ar_leads (Admin-only read access)
DROP POLICY IF EXISTS "Allow public select ar_leads" ON public.ar_leads;
DROP POLICY IF EXISTS "Allow admin select ar_leads" ON public.ar_leads;
CREATE POLICY "Allow admin select ar_leads" ON public.ar_leads 
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Force cache reload
NOTIFY pgrst, 'reload schema';
