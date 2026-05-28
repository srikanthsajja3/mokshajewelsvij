-- Fixes for Admin and Order permissions

-- 1. Allow Admins to see all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- 2. Allow Admins to update order status
CREATE POLICY "Admins can update order status" 
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- 3. Allow Admins to see all order items
CREATE POLICY "Admins can view all order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- 4. Allow Admins to manage all products
CREATE POLICY "Admins can manage all products" 
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- 5. Allow Vendors to manage their own products
CREATE POLICY "Vendors can manage their own products" 
ON public.products FOR ALL
USING (
  vendor_id IN (
    SELECT vendor_id FROM public.vendor_settings
    WHERE user_id = auth.uid()
  )
);
