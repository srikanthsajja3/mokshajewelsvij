-- ==========================================
-- CONSOLIDATED FIX FOR ORDER POLICIES & STATUS
-- 1. Updates check constraints for all statuses
-- 2. Implements non-recursive RLS for ALL operations
-- ==========================================

-- 1. Helper Functions (SECURITY DEFINER bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_order_owner(order_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id_param AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_order_vendor(order_uuid_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = order_uuid_param
    AND p.vendor_id IN (
      SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Expand Allowed Statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'failed', 'cancelled'));

-- 3. Reset and Re-implement ORDERS Policies
DROP POLICY IF EXISTS "Orders access policy" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders containing their products" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- SELECT: Owner, Admin, or Vendor
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR public.is_order_vendor(id)
);

-- INSERT: Authenticated users can insert their own orders
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins or Vendors (for status updates)
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR public.is_order_vendor(id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR public.is_order_vendor(id)
);

-- DELETE: Owner can delete (cancel) if not already shipped/delivered
CREATE POLICY "orders_delete_policy" ON public.orders FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  AND status NOT IN ('shipped', 'delivered')
);

-- 4. Reset and Re-implement ORDER_ITEMS Policies
DROP POLICY IF EXISTS "Order items access policy" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their own product sales" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;

-- SELECT: Owner, Admin, or Product-Vendor
CREATE POLICY "order_items_select_policy" ON public.order_items FOR SELECT TO authenticated
USING (
  public.is_order_owner(order_id)
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
    AND p.vendor_id IN (SELECT vendor_id FROM public.vendor_settings WHERE user_id = auth.uid())
  )
);

-- INSERT: Owner can insert
CREATE POLICY "order_items_insert_policy" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (public.is_order_owner(order_id));

-- 5. Refresh Cache
NOTIFY pgrst, 'reload schema';
