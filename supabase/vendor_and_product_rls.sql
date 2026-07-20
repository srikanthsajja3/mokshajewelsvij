-- =======================================================
-- CONSOLIDATED RLS POLICIES FOR PRODUCTS, VENDORS & PROFILES
-- =======================================================

-- 1. Enable RLS on Products, Categories, Profiles
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- PRODUCTS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" 
ON public.products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" 
ON public.products FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
CREATE POLICY "Vendors can insert their own products" 
ON public.products FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_settings 
    WHERE user_id = auth.uid() 
    AND vendor_id = products.vendor_id 
    AND is_verified = true
  )
);

DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
CREATE POLICY "Vendors can update their own products" 
ON public.products FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_settings 
    WHERE user_id = auth.uid() 
    AND vendor_id = products.vendor_id 
    AND is_verified = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_settings 
    WHERE user_id = auth.uid() 
    AND vendor_id = products.vendor_id 
    AND is_verified = true
  )
);

DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;
CREATE POLICY "Vendors can delete their own products" 
ON public.products FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_settings 
    WHERE user_id = auth.uid() 
    AND vendor_id = products.vendor_id 
    AND is_verified = true
  )
);


-- =======================================================
-- CATEGORIES POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" 
ON public.categories FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =======================================================
-- PROFILES POLICIES (Role Escalation Protection)
-- =======================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile details but not role" ON public.profiles;
CREATE POLICY "Users can update their own profile details but not role" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);


-- Protect profile roles from escalation
CREATE OR REPLACE FUNCTION public.check_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
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


-- Force cache reload
NOTIFY pgrst, 'reload schema';
