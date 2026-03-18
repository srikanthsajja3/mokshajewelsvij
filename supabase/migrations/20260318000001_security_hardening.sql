-- Security Hardening for MOKSHA JEWELS

-- 1. Tighten the Public Policy to only show Published Products
-- First, let's add an 'is_published' column to products for more control
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- Drop the old overly-broad policy
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;

-- Create a new refined policy: public can only see 'published' items
CREATE POLICY "Public Read Access: Published Only" 
ON public.products 
FOR SELECT 
USING (is_published = TRUE);

-- 2. Prevent ANY modification via the 'anon' role, even if a policy exists
-- This is a 'defense-in-depth' measure
REVOKE ALL ON public.products FROM anon;
GRANT SELECT ON public.products TO anon;

REVOKE ALL ON public.categories FROM anon;
GRANT SELECT ON public.categories TO anon;

REVOKE ALL ON public.gold_rates FROM anon;
GRANT SELECT ON public.gold_rates TO anon;

-- 3. Audit Logging (Optional)
-- In a more advanced setup, we would add a trigger here to log when a product is viewed.
-- For now, let's just ensure we have good timestamps.
COMMENT ON TABLE public.products IS 'Jewelry catalog for MOKSHA JEWELS with RLS protection.';
