-- Migration: Align items categories and types with UI filters
-- Date: 2026-09-06

-- 1. Ensure category_name and type columns exist on public.items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS type text;

-- 2. Update category_name
UPDATE public.items
SET category_name = 'Polki'
WHERE name ILIKE '%polki%' OR sku ILIKE '%polki%' OR label_no ILIKE '%polki%';

UPDATE public.items
SET category_name = 'Kundan'
WHERE (name ILIKE '%kundan%' OR sku ILIKE '%kundan%' OR label_no ILIKE '%kundan%')
  AND category_name IS NULL;

UPDATE public.items
SET category_name = 'Diamonds'
WHERE (name ILIKE 'D %'
   OR sku ILIKE 'D%'
   OR label_no ILIKE 'D%'
   OR dai_wt > 0
   OR dai_pcs > 0
   OR stones_in_detail ILIKE '%diamond%')
  AND category_name IS NULL;

UPDATE public.items
SET category_name = 'Gold'
WHERE category_name IS NULL;

-- 3. Update sub-categories (type)
UPDATE public.items
SET type = 'Ear Rings'
WHERE name ~* '(TOPS|DTPS|JUMKA|JUMKI|DJK|GJM|BALI|GBL|HANGING|GHG|EARRING|STUD|BUTTALU|DBL)'
   OR sku ~* '(TOPS|DTPS|JUMKA|JUMKI|DJK|GJM|BALI|GBL|HANGING|GHG|EARRING|STUD|BUTTALU|DBL)'
   OR label_no ~* '(TOPS|DTPS|JUMKA|JUMKI|DJK|GJM|BALI|GBL|HANGING|GHG|EARRING|STUD|BUTTALU|DBL)';

UPDATE public.items
SET type = 'Bajubands'
WHERE (name ~* '(VADDANAM|DVD|BAJUBAND|BJB)'
   OR sku ~* '(VADDANAM|DVD|BAJUBAND|BJB)'
   OR label_no ~* '(VADDANAM|DVD|BAJUBAND|BJB)')
  AND type IS NULL;

UPDATE public.items
SET type = 'Rings'
WHERE (name ~* '(RING|DRG|GRG)'
   OR sku ~* '(RING|DRG|GRG)'
   OR label_no ~* '(RING|DRG|GRG)')
  AND type IS NULL;

UPDATE public.items
SET type = 'Bangles'
WHERE (name ~* '(BANGLE|DBG|GBP|KADA|GKD|BRACELET|BRACELETE|DBR)'
   OR sku ~* '(BANGLE|DBG|GBP|KADA|GKD|BRACELET|BRACELETE|DBR)'
   OR label_no ~* '(BANGLE|DBG|GBP|KADA|GKD|BRACELET|BRACELETE|DBR)')
  AND type IS NULL;

UPDATE public.items
SET type = 'Chains'
WHERE (name ~* '(BLACK BEED|BLACKBEED|BLACK BEEDS|BLACKBEEDS|CHAIN|GCH|BBC|DBB)'
   OR sku ~* '(BLACK BEED|BLACKBEED|BLACK BEEDS|BLACKBEEDS|CHAIN|GCH|BBC|DBB)'
   OR label_no ~* '(BLACK BEED|BLACKBEED|BLACK BEEDS|BLACKBEEDS|CHAIN|GCH|BBC|DBB)')
  AND type IS NULL;

UPDATE public.items
SET type = 'Necklaces'
WHERE type IS NULL;

-- 4. Sync public.products table if it exists
DO 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    UPDATE public.products p
    SET category_name = i.category_name,
        type = i.type
    FROM public.items i
    WHERE p.id = i.id OR p.product_code = i.sku OR p.product_code = i.label_no;
  END IF;
END ;
