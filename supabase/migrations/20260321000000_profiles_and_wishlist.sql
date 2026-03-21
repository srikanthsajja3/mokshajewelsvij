  -- Migration for User Profiles and Wishlist for MOKSHA JEWELS

  -- 1. Create 'profiles' table
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    default_address TEXT,
    city TEXT,
    zip_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 2. Create 'wishlist' table
  CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
  );

  -- 3. Enable RLS
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

  -- 4. Create RLS Policies for Profiles
  CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

  CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

  -- 5. Create RLS Policies for Wishlist
  CREATE POLICY "Users can view their own wishlist" 
  ON public.wishlist FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can add items to their own wishlist" 
  ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can remove items from their own wishlist" 
  ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

  -- 6. Trigger to create profile on signup (Optional but recommended)
  CREATE OR REPLACE FUNCTION public.handle_new_user() 
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
