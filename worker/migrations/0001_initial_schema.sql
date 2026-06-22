-- Thrief Database Schema for Cloudflare D1 (SQLite)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('buyer','seller','admin')) NOT NULL DEFAULT 'buyer',
  avatar_url TEXT DEFAULT '',
  district TEXT DEFAULT '',
  is_verified INTEGER DEFAULT 0,
  is_banned INTEGER DEFAULT 0,
  ban_reason TEXT DEFAULT '',
  response_rate REAL DEFAULT 0,
  ratings_avg REAL DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT DEFAULT '',
  condition TEXT CHECK(condition IN ('new','like-new','good','fair','poor')) NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  negotiable INTEGER DEFAULT 0,
  images TEXT DEFAULT '[]',
  video_url TEXT DEFAULT '',
  seller_id TEXT NOT NULL REFERENCES users(id),
  district TEXT NOT NULL,
  contact_preference TEXT DEFAULT 'chat',
  status TEXT CHECK(status IN ('pending','active','sold','removed')) DEFAULT 'pending',
  payment_id TEXT,
  view_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- OTPs
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  code_hash TEXT NOT NULL,
  type TEXT CHECK(type IN ('registration','password-reset')) NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT,
  amount REAL DEFAULT 5,
  method TEXT CHECK(method IN ('esewa','khalti','bank-transfer')) NOT NULL,
  transaction_id TEXT DEFAULT '',
  status TEXT CHECK(status IN ('pending','confirmed','failed','refunded')) DEFAULT 'pending',
  gateway_response TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Chats
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  last_message TEXT DEFAULT '',
  last_message_type TEXT DEFAULT 'text',
  last_sender_id TEXT DEFAULT '',
  last_message_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  content TEXT DEFAULT '',
  type TEXT CHECK(type IN ('text','image','video')) DEFAULT 'text',
  media_url TEXT DEFAULT '',
  status TEXT CHECK(status IN ('sent','delivered','read')) DEFAULT 'sent',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  rater_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  stars INTEGER CHECK(stars BETWEEN 1 AND 5) NOT NULL,
  comment TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(rater_id, seller_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT CHECK(target_type IN ('product','user')) NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT CHECK(reason IN ('spam','fake','inappropriate','scam','other')) NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK(status IN ('pending','reviewed','resolved','dismissed')) DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_district ON products(district);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_buyer ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_seller ON ratings(seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_otps_user ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller ON payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
