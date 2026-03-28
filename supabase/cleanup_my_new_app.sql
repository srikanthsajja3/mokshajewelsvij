-- ==========================================
-- UPDATED CLEANUP SCRIPT FOR MY-NEW-APP (Moksha Jewels)
-- Run this in the Supabase SQL Editor of 'my-new-app'
-- ==========================================

-- 1. Drop stock-related views first
DROP VIEW IF EXISTS staff_items;

-- 2. Drop stock-related tables (CASCADE removes associated policies/triggers)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 3. Cleanup Categories Table
-- Safely remove 'parent_id' column if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'categories' 
               AND column_name = 'parent_id') THEN
        ALTER TABLE public.categories DROP COLUMN parent_id CASCADE;
    END IF;
END $$;

-- Delete categories that don't belong in Moksha Jewels
DELETE FROM public.categories 
WHERE name IN ('Electronics', 'Tools', 'Office Supplies');

-- Ensure correct categories exist
INSERT INTO public.categories (name) 
VALUES ('Gold'), ('Diamonds') 
ON CONFLICT (name) DO NOTHING;

-- 4. Fix Profiles Table
-- Restore roles: 'customer', 'admin', 'vendor'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'admin', 'vendor'));

-- Update any profiles set to 'staff' back to 'customer'
UPDATE public.profiles SET role = 'customer' WHERE role = 'staff';

-- Set default back to 'customer'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';

-- 5. Seed Check (Restore sample data)
INSERT INTO products (
    name, category_name, product_code, gross_weight, gold_weight, purity, metal_color, base_price_usd, rating
) VALUES 
('Eternal Radiance Ring', 'Gold', 'MJ-RG-001', 4.500, 4.200, '22 KT', 'Yellow Gold', 550.00, 4.8),
('Royal Heritage Necklace', 'Gold', 'MJ-NK-002', 25.500, 22.800, '22 KT', 'Yellow Gold', 2800.00, 4.9)
ON CONFLICT (product_code) DO NOTHING;
