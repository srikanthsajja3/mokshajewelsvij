-- ==========================================
-- FIX ORDERS-PROFILES JOIN
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add missing Foreign Key constraint from orders to profiles
-- This allows Supabase (PostgREST) to perform joins like orders(*, profiles(*))
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_profiles_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 2. Refresh PostgREST Cache
-- This forces Supabase to re-scan the table structure and detect the new relationship
NOTIFY pgrst, 'reload schema';
