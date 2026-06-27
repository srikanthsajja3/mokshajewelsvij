-- MOKSHA JEWELS - MASTER DATABASE SCHEMA
-- This is the single source of truth for the project database structure.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Profiles Table (User metadata)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['customer'::text, 'admin'::text, 'vendor'::text])),
  full_name text,
  phone_number text, -- Added for Personal Information support
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Categories Table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- 4. Vendors Table
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  contact_person text,
  email text,
  phone text,
  address text,
  rating numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);

-- 5. Products Table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category_name text,
  image_url text,
  product_code text NOT NULL UNIQUE,
  gross_weight numeric NOT NULL,
  gold_weight numeric NOT NULL,
  purity text NOT NULL,
  metal_color text NOT NULL,
  base_price_usd numeric NOT NULL,
  metal_price_usd numeric,
  va_making_usd numeric,
  stone_beads_usd numeric,
  tax_usd numeric,
  rating numeric DEFAULT 0,
  popularity integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type text,
  collection text,
  gender text,
  occasion text,
  design_theme text,
  gemstone_type text,
  gemstone_weight numeric,
  vendor_id uuid,
  stock_quantity integer DEFAULT 0,
  sourcing_cost numeric DEFAULT 0,
  gallery_urls text[] DEFAULT '{}'::text[],
  matching_product_id uuid,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_name_fkey FOREIGN KEY (category_name) REFERENCES public.categories(name),
  CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT products_matching_product_id_fkey FOREIGN KEY (matching_product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- 6. Addresses Table
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  label text DEFAULT 'Home'::text,
  full_name text NOT NULL,
  phone_number text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  zip_code text NOT NULL,
  country text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Orders Table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  shipping_address text NOT NULL,
  city text NOT NULL,
  zip_code text NOT NULL,
  status text NOT NULL DEFAULT 'paid'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'shipped'::text, 'delivered'::text, 'failed'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  payment_intent_id text,
  shipping_country text,
  address_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL,
  CONSTRAINT orders_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 8. Order Items Table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- 9. Cart Items Table
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- 10. Wishlist Table
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- 11. Reviews Table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 12. Gold Rates Table
CREATE TABLE public.gold_rates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  purity text NOT NULL,
  rate_per_gram_usd numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gold_rates_pkey PRIMARY KEY (id)
);

-- 13. Vendor Settings Table
CREATE TABLE public.vendor_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  vendor_id uuid,
  api_key_hash text,
  webhook_url text,
  business_name text,
  is_verified boolean DEFAULT false,
  commission_rate numeric DEFAULT 10.00,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT vendor_settings_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT vendor_settings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL
);
