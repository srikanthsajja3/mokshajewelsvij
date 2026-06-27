-- Add unique constraint to wishlist to support unique inserts and avoid duplicate records (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlist_user_id_product_id_key' 
          AND table_name = 'wishlist'
    ) THEN
        ALTER TABLE public.wishlist 
        ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
END $$;
