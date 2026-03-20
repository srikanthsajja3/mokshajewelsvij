-- Seed Data for MOKSHA JEWELS

-- Ensure Categories exist first
INSERT INTO categories (name) VALUES 
('Gold'), 
('Diamonds')
ON CONFLICT (name) DO NOTHING;

-- Insert/Update Sample Products
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
    'Gold', 
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
    'Gold', 
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
    'Gold', 
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
    'Diamond Solitaire Studs', 
    'Diamonds', 
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800', 
    'MJ-DM-006', 
    3.200, 
    2.800, 
    '18 KT', 
    'White Gold', 
    1250.00, 
    250.00, 
    100.00, 
    800.00, 
    100.00, 
    4.9, 
    210
)
ON CONFLICT (product_code) DO UPDATE SET
    name = EXCLUDED.name,
    category_name = EXCLUDED.category_name,
    image_url = EXCLUDED.image_url,
    gross_weight = EXCLUDED.gross_weight,
    gold_weight = EXCLUDED.gold_weight,
    purity = EXCLUDED.purity,
    metal_color = EXCLUDED.metal_color,
    base_price_usd = EXCLUDED.base_price_usd,
    metal_price_usd = EXCLUDED.metal_price_usd,
    va_making_usd = EXCLUDED.va_making_usd,
    stone_beads_usd = EXCLUDED.stone_beads_usd,
    tax_usd = EXCLUDED.tax_usd,
    rating = EXCLUDED.rating,
    popularity = EXCLUDED.popularity;
