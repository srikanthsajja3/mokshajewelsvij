-- Enable Order Deletion for Users

-- 1. Create RLS Policy for Order Deletion
CREATE POLICY "Users can delete their own orders" 
ON public.orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Note: order_items table already has ON DELETE CASCADE on the order_id reference,
-- so deleting an order will automatically remove its associated items.
