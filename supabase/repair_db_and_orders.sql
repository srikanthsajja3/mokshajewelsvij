-- ==========================================
-- REPAIR SCRIPT FOR MOKSHA JEWELS
-- Ensures profiles exist and fixes orders join
-- ==========================================

-- 1. Ensure all users have a profile
-- This fixes issues where existing users created before the profile trigger don't have a profile
INSERT INTO public.profiles (id, role, updated_at)
SELECT id, 'customer', now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure orders table has correct FK to profiles (needed for join)
-- Drop old one if it points to auth.users (though Supabase allows it, join syntax prefers profiles)
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_profiles_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Ensure order_items table exists with correct constraints
-- (Just in case something is missing)
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) 
ON DELETE SET NULL;

-- 4. Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
