-- ==========================================
-- FIX ORDER PERMISSIONS FOR ADMINS & VENDORS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. ADMIN POLICIES
-- Allow Admins to see all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admins to update any order (e.g. status)
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admins to see all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" 
ON public.order_items FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. VENDOR POLICIES
-- Allow Vendors to view order items for their products
DROP POLICY IF EXISTS "Vendors can view their own product sales" ON public.order_items;
CREATE POLICY "Vendors can view their own product sales" 
ON public.order_items FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE public.products.id = public.order_items.product_id
    AND public.products.vendor_id IN (
      SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid()
    )
  )
);

-- Allow Vendors to view the parent order (to see shipping info) for their products
DROP POLICY IF EXISTS "Vendors can view orders containing their products" ON public.orders;
CREATE POLICY "Vendors can view orders containing their products" 
ON public.orders FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_items
    JOIN public.products ON public.products.id = public.order_items.product_id
    WHERE public.order_items.order_id = public.orders.id
    AND public.products.vendor_id IN (
      SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid()
    )
  )
);

-- 3. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
