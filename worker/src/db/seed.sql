-- Seed data for development
-- Admin account (password: Admin@123456 — will be hashed on first login setup)
-- In production, run the auth/register endpoint manually

INSERT OR IGNORE INTO users (id, name, email, phone, role, is_verified, password_hash) 
VALUES ('demo-seller', 'Demo Seller', 'demo@thrief.com', '9800000000', 'seller', 1, 'dummy_hash_for_seed');

-- Sample products for testing
INSERT OR IGNORE INTO products (id, title, slug, description, category, sub_category, condition, price, negotiable, images, seller_id, district, status, created_at)
VALUES 
  ('demo-1', 'iPhone 13 Pro - Like New', 'iphone-13-pro-like-new', 'Barely used iPhone 13 Pro, 256GB, Pacific Blue. Comes with original box, charger, and case. Battery health 96%. No scratches or dents.', 'electronics', 'Phones', 'like-new', 85000, 1, '[]', 'demo-seller', 'Kathmandu', 'active', datetime('now', '-2 days')),
  ('demo-2', 'Wooden Study Table - Good Condition', 'wooden-study-table-good-condition', 'Solid wooden study table, 4ft x 2ft. Some minor wear on the surface but structurally perfect. Great for students.', 'furniture-home', 'Tables', 'good', 4500, 1, '[]', 'demo-seller', 'Lalitpur', 'active', datetime('now', '-5 days')),
  ('demo-3', 'Nike Air Max 270 - Size 42', 'nike-air-max-270-size-42', 'Original Nike Air Max 270, worn only twice. Size 42 (US 8.5). White/Black colorway. Selling because wrong size.', 'clothes', 'Men''s Clothing', 'like-new', 6500, 0, '[]', 'demo-seller', 'Kathmandu', 'active', datetime('now', '-1 day')),
  ('demo-4', 'The Alchemist by Paulo Coelho', 'the-alchemist-paulo-coelho', 'Paperback edition, good condition. Some highlighting inside but all pages intact. Perfect for book lovers.', 'books-stationery', '', 'good', 350, 0, '[]', 'demo-seller', 'Bhaktapur', 'active', datetime('now', '-3 days')),
  ('demo-5', 'Samsung 32" LED TV', 'samsung-32-led-tv', 'Samsung 32 inch LED TV, 2 years old. Full HD, works perfectly. Comes with remote and wall mount. Selling due to upgrade.', 'electronics', 'TVs', 'good', 12000, 1, '[]', 'demo-seller', 'Morang', 'active', datetime('now', '-7 days')),
  ('demo-6', 'Yoga Mat - Premium Quality', 'yoga-mat-premium-quality', '6mm thick yoga mat, non-slip surface. Used for 3 months. Purple color. Includes carry strap.', 'sports-fitness', '', 'good', 800, 0, '[]', 'demo-seller', 'Kaski', 'active', datetime('now', '-4 days'));
