-- Migration: Complete Security Hardening & RLS Policies
-- Description: Enforces Row Level Security (RLS) across all tables, prevents role escalation, and secures gold_rates, products, orders, profiles, and vendors.

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gold_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- 2. Security Helper Functions (Avoids RLS recursion loops)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_vendor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'vendor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Profiles Policies (Prevent role escalation)
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile without role escalation" ON public.profiles;
CREATE POLICY "Users update own profile without role escalation" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Products Policies
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin/Vendor write products" ON public.products;
CREATE POLICY "Admin/Vendor write products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin_or_vendor());

-- 5. Gold Rates Policies
DROP POLICY IF EXISTS "Public gold rates read" ON public.gold_rates;
CREATE POLICY "Public gold rates read" ON public.gold_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write gold rates" ON public.gold_rates;
CREATE POLICY "Admin write gold rates" ON public.gold_rates
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 6. Orders Policies
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin());
