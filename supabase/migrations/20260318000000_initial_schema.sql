-- Initial Schema for MOKSHA JEWELS

-- 1. Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_name TEXT REFERENCES categories(name),
  image_url TEXT,
  product_code TEXT UNIQUE NOT NULL,
  gross_weight DECIMAL(10,3) NOT NULL,
  gold_weight DECIMAL(10,3) NOT NULL,
  purity TEXT NOT NULL, -- e.g., '22 KT', '18 KT'
  metal_color TEXT NOT NULL, -- e.g., 'Yellow', 'Rose', 'White'
  base_price_usd DECIMAL(12,2) NOT NULL,
  
  -- Price Breakup (Stored as decimals for calculation)
  metal_price_usd DECIMAL(12,2),
  va_making_usd DECIMAL(12,2),
  stone_beads_usd DECIMAL(12,2),
  tax_usd DECIMAL(12,2),
  
  rating DECIMAL(2,1) DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Gold Rates Table (For keeping history/current rates)
CREATE TABLE gold_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purity TEXT NOT NULL, -- '24K', '22K', '18K'
  rate_per_gram_usd DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS (Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_rates ENABLE ROW LEVEL SECURITY;

-- 5. Create Public Read Policies
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on gold_rates" ON gold_rates FOR SELECT USING (true);

-- 6. Insert Default Categories
INSERT INTO categories (name) VALUES 
('Rings'), 
('Necklaces'), 
('Earrings'), 
('Bracelets'), 
('Bangles');
