-- ==========================================
-- FIX ADMIN PERMISSIONS FOR PRODUCTS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create a policy to allow Admins to manage ALL products
-- This allows Admins to insert, update, and delete products for any vendor
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

CREATE POLICY "Admins can manage all products" 
ON public.products FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Also ensure Admins can manage categories (useful for adding new product types)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
