-- Insert seed data into homepage_banners table
INSERT INTO public.homepage_banners (id, image_url, alt_text, display_order) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200', 'Moksha Jewels Bridal Collection - Gold and Diamonds', 1),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=1200', 'Exquisite Handcrafted Jewellery - Premium Boutique', 2),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200', 'BIS Hallmarked Gold Ornaments - Traditional Designs', 3),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&q=80&w=1200', 'Certified Diamond Jewellery - Shaped Diamonds', 4)
ON CONFLICT (id) DO NOTHING;
