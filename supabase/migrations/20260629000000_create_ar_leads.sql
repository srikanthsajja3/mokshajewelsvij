-- Migration to create the ar_leads table for gathering customer contacts during Virtual Try-On

CREATE TABLE IF NOT EXISTS public.ar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  phone_number text NOT NULL,
  product_id text,
  product_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ar_leads ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous users to insert lead entries
DROP POLICY IF EXISTS "Allow public insert ar_leads" ON public.ar_leads;
CREATE POLICY "Allow public insert ar_leads" ON public.ar_leads 
  FOR INSERT WITH CHECK (true);

-- Allow admin select only (for admin panel)
DROP POLICY IF EXISTS "Allow public select ar_leads" ON public.ar_leads;
CREATE POLICY "Allow admin select ar_leads" ON public.ar_leads 
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
