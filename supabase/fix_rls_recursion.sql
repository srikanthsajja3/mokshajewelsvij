-- ==========================================
-- FIX RLS INFINITE RECURSION
-- Breaking the circular dependency between orders and order_items
-- ==========================================

-- 1. Helper Functions (SECURITY DEFINER bypasses RLS)

-- Check if an order belongs to the current user (as customer)
CREATE OR REPLACE FUNCTION public.is_order_owner(order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if an order contains products belonging to the current user (as vendor)
CREATE OR REPLACE FUNCTION public.is_order_vendor(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = order_uuid
    AND p.vendor_id IN (
      SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up existing recursive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders containing their products" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their own product sales" ON public.order_items;

-- 3. Re-implement non-recursive policies for ORDERS
CREATE POLICY "Orders access policy" 
ON public.orders FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() -- Direct ownership check (no table join needed)
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Admin check
  OR 
  public.is_order_vendor(id) -- Vendor check via SECURITY DEFINER (breaks recursion)
);

-- 4. Re-implement non-recursive policies for ORDER_ITEMS
CREATE POLICY "Order items access policy" 
ON public.order_items FOR SELECT 
TO authenticated
USING (
  public.is_order_owner(order_id) -- Owner check via SECURITY DEFINER (breaks recursion)
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Admin check
  OR 
  EXISTS ( -- Direct vendor check on the product (no orders table join needed)
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
    AND p.vendor_id IN (
      SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid()
    )
  )
);

-- 5. Refresh Cache
NOTIFY pgrst, 'reload schema';
