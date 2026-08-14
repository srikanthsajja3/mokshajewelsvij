-- 1. Fix: Drop any faulty triggers on gold_rates that execute parameterless UPDATE statements
DROP TRIGGER IF EXISTS tr_sync_gold_rates ON public.gold_rates;
DROP TRIGGER IF EXISTS sync_gold_rates_trigger ON public.gold_rates;
DROP TRIGGER IF EXISTS tr_update_product_prices ON public.gold_rates;
DROP TRIGGER IF EXISTS update_gold_rate_trigger ON public.gold_rates;

-- 2. Create Table if not exists
CREATE TABLE IF NOT EXISTS public.gold_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purity text NOT NULL,
  rate_per_gram_usd numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gold_rates_pkey PRIMARY KEY (id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.gold_rates ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow anyone (customers, guests, vendors) to read gold rates
DROP POLICY IF EXISTS "Allow public read access to gold rates" ON public.gold_rates;
CREATE POLICY "Allow public read access to gold rates" 
ON public.gold_rates FOR SELECT 
USING (true);

-- 5. Policy: Allow only admins to insert gold rates
DROP POLICY IF EXISTS "Allow admins to insert gold rates" ON public.gold_rates;
CREATE POLICY "Allow admins to insert gold rates" 
ON public.gold_rates FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Policy: Allow only admins to update gold rates
DROP POLICY IF EXISTS "Allow admins to update gold rates" ON public.gold_rates;
CREATE POLICY "Allow admins to update gold rates" 
ON public.gold_rates FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 7. Policy: Allow only admins to delete gold rates
DROP POLICY IF EXISTS "Allow admins to delete gold rates" ON public.gold_rates;
CREATE POLICY "Allow admins to delete gold rates" 
ON public.gold_rates FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
