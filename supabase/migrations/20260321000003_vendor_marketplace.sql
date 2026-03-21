  -- Migration for Multi-Vendor Marketplace Support

  -- 1. Update role check constraint
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'vendor'));

  -- 2. Link vendors to users
  -- A vendor profile allows a user to act as a seller
  CREATE TABLE IF NOT EXISTS public.vendor_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    api_key_hash TEXT, -- For M2M Edge Function auth
    webhook_url TEXT,
    business_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10%
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 3. Enable RLS
  ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

  -- 4. RLS Policies
  CREATE POLICY "Vendors can view their own settings" 
  ON public.vendor_settings FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Vendors can update their own settings" 
  ON public.vendor_settings FOR UPDATE USING (auth.uid() = user_id);

  -- Update products policies to allow vendors to manage their own stock
  CREATE POLICY "Vendors can manage their own products" 
  ON public.products FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_settings 
      WHERE user_id = auth.uid() AND vendor_id = public.products.vendor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_settings 
      WHERE user_id = auth.uid() AND vendor_id = public.products.vendor_id
    )
  );

  -- 5. Trigger to auto-create vendor settings if role is vendor
  CREATE OR REPLACE FUNCTION public.handle_vendor_setup() 
  RETURNS trigger AS $$
  BEGIN
    IF new.role = 'vendor' THEN
      INSERT INTO public.vendor_settings (user_id, business_name)
      VALUES (new.id, new.full_name)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_role_vendor_change
    AFTER UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_vendor_setup();
