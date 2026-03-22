-- Migration to add extended metadata to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS collection TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS occasion TEXT,
ADD COLUMN IF NOT EXISTS design_theme TEXT,
ADD COLUMN IF NOT EXISTS gemstone_type TEXT,
ADD COLUMN IF NOT EXISTS gemstone_weight NUMERIC;

-- Update RLS policies to allow inserts with new columns
-- (Usually handled by existing policies if they are column-agnostic)
