-- Migration to add gallery and 360 viewer support to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS three_sixty_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_360_view BOOLEAN DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN public.products.gallery_urls IS 'Array of URLs for the product image gallery';
COMMENT ON COLUMN public.products.three_sixty_urls IS 'Ordered array of URLs for the 360-degree rotation view';
