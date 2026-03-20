-- Update categories to match UI
DELETE FROM categories;
INSERT INTO categories (name) VALUES ('Gold'), ('Diamonds');

-- Update existing products to fall under 'Gold' (default for now)
UPDATE products SET category_name = 'Gold' WHERE category_name IS NOT NULL;

-- Update products with no category (just in case)
UPDATE products SET category_name = 'Gold' WHERE category_name IS NULL;
