-- Orders and Order Items for MOKSHA JEWELS

-- 1. Create the 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  status TEXT DEFAULT 'paid' NOT NULL, -- e.g., 'pending', 'paid', 'shipped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own orders (when placing an order)
CREATE POLICY "Users can insert their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view items for their own orders
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.user_id = auth.uid()
  )
);

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert their own order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.user_id = auth.uid()
  )
);
