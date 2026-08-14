-- Migration: Create public.items table for inventory APK compatibility
-- Date: 2026-08-09

-- 1. Create update_modified_column trigger function if not exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create public.items table
CREATE TABLE IF NOT EXISTS public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  name text NOT NULL,
  sku text NULL,
  category_id uuid NULL,
  unit text NULL DEFAULT 'pcs'::text,
  location text NULL,
  image_url text NULL,
  min_stock_level integer NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  label_no text NULL,
  purity text NULL,
  gross_wt numeric(10, 3) NULL DEFAULT 0,
  net_wt numeric(10, 3) NULL DEFAULT 0,
  dai_wt numeric(10, 3) NULL DEFAULT 0,
  dai_pcs integer NULL DEFAULT 0,
  clr_stone_wt numeric(10, 3) NULL DEFAULT 0,
  clr_stone_pcs integer NULL DEFAULT 0,
  wastage numeric(10, 3) NULL DEFAULT 0,
  labour_rate numeric(10, 2) NULL DEFAULT 0,
  labour_amt numeric(10, 2) NULL DEFAULT 0,
  doc_no text NULL,
  doc_date date NULL,
  size text NULL,
  labeling_date date NULL DEFAULT CURRENT_DATE,
  purch_wastage_rate numeric(10, 3) NULL DEFAULT 0,
  quality text NULL,
  other_charges numeric(10, 2) NULL DEFAULT 0,
  dia_purchase_amt numeric(10, 2) NULL DEFAULT 0,
  stone_purchase_amt numeric(10, 2) NULL DEFAULT 0,
  huid text NULL,
  cost_price numeric(10, 2) NULL,
  supplier_name text NULL,
  supplier_contact text NULL,
  stones_in_detail text NULL,
  dai_rd numeric(10, 3) NULL DEFAULT 0,
  dai_pear numeric(10, 3) NULL DEFAULT 0,
  dai_stb numeric(10, 3) NULL DEFAULT 0,
  igi_fee numeric(10, 2) NULL DEFAULT 0,
  image_urls text[] NULL DEFAULT '{}'::text[],
  last_scanned_at timestamp with time zone NULL,
  last_scanned_by text NULL,
  in_exhibition boolean NULL DEFAULT false,
  exhibition_added_at timestamp with time zone NULL,
  prc_amount numeric(10, 2) NULL DEFAULT 0,
  weight_with_tag numeric NULL DEFAULT 0,
  is_remarked boolean NULL DEFAULT false,
  remarked_weight numeric(10, 3) NULL,
  remarked_at timestamp with time zone NULL,
  quantity integer NOT NULL DEFAULT 1,
  pcs integer NULL DEFAULT 0,
  description text NULL,
  barcode text NULL,
  thumbnail_url text NULL,
  thumbnail_urls text[] NULL DEFAULT '{}'::text[],
  number_of_tags integer NOT NULL DEFAULT 1,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_barcode_key UNIQUE (barcode),
  CONSTRAINT items_sku_key UNIQUE (sku)
);

-- 3. Create index for exhibition items
CREATE INDEX IF NOT EXISTS idx_items_in_exhibition ON public.items USING btree (in_exhibition)
WHERE (in_exhibition = true);

-- 4. Create modified column trigger
DROP TRIGGER IF EXISTS update_items_modtime ON public.items;
CREATE TRIGGER update_items_modtime BEFORE
UPDATE ON public.items FOR EACH ROW
EXECUTE FUNCTION update_modified_column ();

-- 5. Enable RLS and add policies
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on items" ON public.items;
CREATE POLICY "Allow public read access on items" ON public.items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated write access on items" ON public.items;
CREATE POLICY "Allow authenticated write access on items" ON public.items
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
