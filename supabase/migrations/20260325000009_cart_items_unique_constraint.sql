-- Add unique constraint to cart_items to support upsert operations on user_id + product_id conflicts (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_user_id_product_id_key' 
          AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE public.cart_items 
        ADD CONSTRAINT cart_items_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
END $$;
