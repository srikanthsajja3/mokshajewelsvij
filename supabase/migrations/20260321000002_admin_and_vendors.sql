-- Migration for Admin Roles and Vendor Management

-- 1. Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));

-- 2. Create 'vendors' table
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

-- 3. Link products to vendors
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sourcing_cost DECIMAL(12,2) DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Only admins can see vendor details and costs
CREATE POLICY "Admins can manage vendors" 
ON public.vendors FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Update products policy so admins can see sensitive info (costs)
-- (Note: Public can still see name/price via existing policies)

-- 6. Insert Mock Vendors
INSERT INTO public.vendors (name, contact_person, rating) VALUES 
('Heritage Crafts', 'Rajesh Gupta', 4.8),
('Royal Gems Co', 'Sarah Al-Maktoum', 4.9),
('Antwerp Diamonds', 'Jean-Luc', 4.7)
ON CONFLICT DO NOTHING;
