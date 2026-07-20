-- Migration to align database constraints and create the ar_leads table

-- 1. Profiles Constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Cart Items Constraints & Uniqueness
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_key UNIQUE (user_id, product_id);

-- 3. Orders Constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_profiles_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Order Items Constraints
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 5. Wishlist Constraints & Uniqueness
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_product_id_fkey;
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_product_id_key;
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);

-- 6. Addresses Constraints
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Vendor Settings Constraints
ALTER TABLE public.vendor_settings DROP CONSTRAINT IF EXISTS vendor_settings_user_id_fkey;
ALTER TABLE public.vendor_settings ADD CONSTRAINT vendor_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.vendor_settings DROP CONSTRAINT IF EXISTS vendor_settings_vendor_id_fkey;
ALTER TABLE public.vendor_settings ADD CONSTRAINT vendor_settings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;

-- 8. Products Matching Constraints
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_matching_product_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_matching_product_id_fkey FOREIGN KEY (matching_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 9. Reviews Constraints
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_profiles_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 10. Ensure the ar_leads table exists for virtual try-on leads
CREATE TABLE IF NOT EXISTS public.ar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  phone_number text NOT NULL,
  product_id text,
  product_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for ar_leads
ALTER TABLE public.ar_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts and selects
DROP POLICY IF EXISTS "Allow public insert ar_leads" ON public.ar_leads;
CREATE POLICY "Allow public insert ar_leads" ON public.ar_leads 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select ar_leads" ON public.ar_leads;
CREATE POLICY "Allow admin select ar_leads" ON public.ar_leads 
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
