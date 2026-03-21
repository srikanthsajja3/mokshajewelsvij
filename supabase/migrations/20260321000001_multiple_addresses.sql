-- Migration for Multiple Addresses support

-- 1. Create 'addresses' table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home', -- Home, Office, Gift, etc.
  full_name TEXT NOT NULL,
  phone_number TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL, -- The target shipping country
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update 'orders' table to include country and address reference
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Addresses
CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- 5. Function to handle default address logic (ensure only one default)
CREATE OR REPLACE FUNCTION public.handle_default_address() 
RETURNS trigger AS $$
BEGIN
  IF new.is_default THEN
    UPDATE public.addresses 
    SET is_default = false 
    WHERE user_id = new.user_id AND id <> new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_address_default_change
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_default_address();
