-- =======================================================
-- CONSOLIDATED RLS POLICIES FOR BANNERS, VENDORS & LEADS
-- =======================================================

-- 1. Enable RLS on Banners, Vendors, Vendor Settings, and AR Leads
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_leads ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- HOMEPAGE BANNERS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow public read access to banners" ON public.homepage_banners;
CREATE POLICY "Allow public read access to banners" 
ON public.homepage_banners FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow admins to manage banners" ON public.homepage_banners;
CREATE POLICY "Allow admins to manage banners" 
ON public.homepage_banners FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =======================================================
-- VENDORS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow public read access to vendors" ON public.vendors;
CREATE POLICY "Allow public read access to vendors" 
ON public.vendors FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow admins to manage vendors" ON public.vendors;
CREATE POLICY "Allow admins to manage vendors" 
ON public.vendors FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =======================================================
-- VENDOR SETTINGS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow users to view own vendor settings" ON public.vendor_settings;
CREATE POLICY "Allow users to view own vendor settings" 
ON public.vendor_settings FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Allow users to manage own vendor settings" ON public.vendor_settings;
CREATE POLICY "Allow users to manage own vendor settings" 
ON public.vendor_settings FOR ALL 
TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- Protect verification and commission rate from self-updates by non-admins
CREATE OR REPLACE FUNCTION public.check_vendor_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
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


-- =======================================================
-- AR LEADS POLICIES (GDPR & Data Privacy Protection)
-- =======================================================
DROP POLICY IF EXISTS "Allow anyone to insert leads" ON public.ar_leads;
CREATE POLICY "Allow anyone to insert leads" 
ON public.ar_leads FOR INSERT 
WITH CHECK (true); -- Public forms

DROP POLICY IF EXISTS "Only admins can view leads" ON public.ar_leads;
CREATE POLICY "Only admins can view leads" 
ON public.ar_leads FOR SELECT 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Only admins can delete leads" ON public.ar_leads;
CREATE POLICY "Only admins can delete leads" 
ON public.ar_leads FOR DELETE 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Force cache reload
NOTIFY pgrst, 'reload schema';
