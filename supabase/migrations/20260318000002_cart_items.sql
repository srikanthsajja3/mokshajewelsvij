-- Cart Items Table for MOKSHA JEWELS

-- 1. Create the 'cart_items' table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure a user can only have one entry per product in their cart
  UNIQUE(user_id, product_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for cart_items
-- A user can only see their own cart items
CREATE POLICY "Users can view their own cart" 
ON public.cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

-- A user can only add items to their own cart
CREATE POLICY "Users can add items to their own cart" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- A user can only update their own cart items (e.g., quantity)
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

-- A user can only delete their own cart items
CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create an 'updated_at' trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Attach the trigger to 'cart_items'
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
