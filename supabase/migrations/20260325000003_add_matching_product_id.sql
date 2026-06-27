-- Add matching_product_id column to products table for explicit cross-product recommendation / pairing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS matching_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
