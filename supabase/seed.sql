-- Seed Data for MOKSHA JEWELS

-- Ensure Categories exist first
INSERT INTO categories (name) VALUES 
('Rings'), 
('Necklaces'), 
('Earrings'), 
('Bracelets'), 
('Bangles')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Products
-- Make sure category_name matches exactly the values in the 'categories' table.
INSERT INTO products (
    name, 
    category_name, 
    image_url, 
    product_code, 
    gross_weight, 
    gold_weight, 
    purity, 
    metal_color, 
    base_price_usd, 
    metal_price_usd, 
    va_making_usd, 
    stone_beads_usd, 
    tax_usd, 
    rating, 
    popularity
) VALUES 
(
    'Eternal Radiance Ring', 
    'Rings', 
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800', 
    'MJ-RG-001', 
    4.500, 
    4.200, 
    '22 KT', 
    'Yellow Gold', 
    550.00, 
    400.00, 
    80.00, 
    20.00, 
    50.00, 
    4.8, 
    120
),
(
    'Royal Heritage Necklace', 
    'Necklaces', 
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800', 
    'MJ-NK-002', 
    25.500, 
    22.800, 
    '22 KT', 
    'Yellow Gold', 
    2800.00, 
    2100.00, 
    450.00, 
    0.00, 
    250.00, 
    4.9, 
    350
),
(
    'Divine Grace Earrings', 
    'Earrings', 
    'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800', 
    'MJ-ER-003', 
    8.200, 
    7.500, 
    '22 KT', 
    'Yellow Gold', 
    850.00, 
    650.00, 
    120.00, 
    30.00, 
    50.00, 
    4.7, 
    95
),
(
    'Rose Petal Bracelet', 
    'Bracelets', 
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800', 
    'MJ-BR-004', 
    12.400, 
    11.200, 
    '18 KT', 
    'Rose Gold', 
    1150.00, 
    850.00, 
    180.00, 
    20.00, 
    100.00, 
    4.6, 
    80
),
(
    'Traditional Gold Bangle', 
    'Bangles', 
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800', 
    'MJ-BN-005', 
    18.000, 
    17.500, 
    '22 KT', 
    'Yellow Gold', 
    1650.00, 
    1350.00, 
    200.00, 
    0.00, 
    100.00, 
    4.5, 
    60
);
