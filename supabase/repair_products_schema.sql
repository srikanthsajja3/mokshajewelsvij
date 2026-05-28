-- ==========================================
-- REPAIR PRODUCTS TABLE SCHEMA
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Ensure vendors table exists first
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add the missing vendor_id and related columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sourcing_cost DECIMAL(12,2) DEFAULT 0;

-- 3. Refresh PostgREST Cache (Important for PGRST204 error)
-- This forces Supabase to re-scan the table structure
NOTIFY pgrst, 'reload schema';

-- 4. Insert default vendors if they are missing
INSERT INTO public.vendors (name, contact_person, rating) VALUES 
('Heritage Crafts', 'Rajesh Gupta', 4.8),
('Royal Gems Co', 'Sarah Al-Maktoum', 4.9),
('Antwerp Diamonds', 'Jean-Luc', 4.7)
ON CONFLICT (name) DO NOTHING;
