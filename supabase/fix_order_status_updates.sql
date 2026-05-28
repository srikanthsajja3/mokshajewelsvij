-- ==========================================
-- FIX ORDER STATUS UPDATES
-- 1. Updates the check constraint to allow more statuses
-- 2. Adds missing UPDATE policies for Admins and Vendors
-- ==========================================

-- 1. Expand allowed statuses in the check constraint
-- First, drop the existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the expanded constraint including 'shipped' and 'delivered'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'failed', 'cancelled'));

-- 2. Ensure Helper Functions are available (from previous fix)
-- (Redefining them here just in case to ensure they are up to date)
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

-- 3. Add UPDATE policies for public.orders
-- Drop existing update policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON public.orders;

-- Allow Admins to update ANY order
CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow Vendors to update orders containing their products
CREATE POLICY "Vendors can update their orders" 
ON public.orders FOR UPDATE
TO authenticated
USING (
  public.is_order_vendor(id)
)
WITH CHECK (
  public.is_order_vendor(id)
);

-- 4. Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
