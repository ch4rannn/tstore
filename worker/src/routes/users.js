// User Routes — Profile, Wishlist, Ratings
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { generateId } from '../services/jwt.js';

const users = new Hono();
users.use('*', authMiddleware);

// GET /api/users/me — Current user profile
users.get('/me', async (c) => {
  const user = c.get('user');
  const profile = await c.env.DB.prepare(
    'SELECT id, name, email, phone, role, avatar_url, district, is_verified, ratings_avg, ratings_count, response_rate, created_at FROM users WHERE id = ?'
  ).bind(user.id).first();

  if (!profile) return c.json({ error: 'User not found' }, 404);
  return c.json({ user: profile });
});

// PUT /api/users/me — Update profile
users.put('/me', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, district, avatar_url } = body;

  const updates = [];
  const values = [];

  if (name) { updates.push('name = ?'); values.push(name.trim()); }
  if (district) { updates.push('district = ?'); values.push(district); }
  if (avatar_url) { updates.push('avatar_url = ?'); values.push(avatar_url); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  updates.push("updated_at = datetime('now')");
  values.push(user.id);

  await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return c.json({ message: 'Profile updated' });
});

// GET /api/users/:id — Public profile
users.get('/:id', async (c) => {
  const userId = c.req.param('id');
  const profile = await c.env.DB.prepare(
    'SELECT id, name, avatar_url, district, role, ratings_avg, ratings_count, response_rate, created_at FROM users WHERE id = ? AND is_banned = 0'
  ).bind(userId).first();

  if (!profile) return c.json({ error: 'User not found' }, 404);

  // Get their active listings count
  const listingCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = 'active'"
  ).bind(userId).first();

  // Get their ratings
  const { results: ratings } = await c.env.DB.prepare(
    'SELECT r.*, u.name as rater_name, u.avatar_url as rater_avatar FROM ratings r JOIN users u ON r.rater_id = u.id WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT 10'
  ).bind(userId).all();

  return c.json({ user: profile, activeListings: listingCount.count, ratings });
});

// POST /api/wishlist/:productId — Toggle wishlist
users.post('/wishlist/:productId', async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');

  const existing = await c.env.DB.prepare(
    'SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?'
  ).bind(user.id, productId).first();

  if (existing) {
    await c.env.DB.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').bind(user.id, productId).run();
    await c.env.DB.prepare('UPDATE products SET wishlist_count = MAX(0, wishlist_count - 1) WHERE id = ?').bind(productId).run();
    return c.json({ wishlisted: false, message: 'Removed from wishlist' });
  } else {
    await c.env.DB.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').bind(user.id, productId).run();
    await c.env.DB.prepare('UPDATE products SET wishlist_count = wishlist_count + 1 WHERE id = ?').bind(productId).run();
    return c.json({ wishlisted: true, message: 'Added to wishlist' });
  }
});

// GET /api/wishlist — Get user's wishlist
users.get('/wishlist/all', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as seller_name FROM wishlists w 
     JOIN products p ON w.product_id = p.id 
     JOIN users u ON p.seller_id = u.id 
     WHERE w.user_id = ? AND p.status = 'active'
     ORDER BY w.created_at DESC`
  ).bind(user.id).all();

  return c.json({
    products: results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
  });
});

// POST /api/ratings — Rate a seller
users.post('/ratings', async (c) => {
  const user = c.get('user');
  const { sellerId, productId, stars, comment } = await c.req.json();

  if (!sellerId || !stars || stars < 1 || stars > 5) {
    return c.json({ error: 'Seller ID and stars (1-5) are required' }, 400);
  }

  if (user.id === sellerId) {
    return c.json({ error: 'Cannot rate yourself' }, 400);
  }

  try {
    const id = generateId();
    await c.env.DB.prepare(
      'INSERT INTO ratings (id, rater_id, seller_id, product_id, stars, comment) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, user.id, sellerId, productId || null, stars, comment || '').run();

    // Update seller's average rating
    const avg = await c.env.DB.prepare(
      'SELECT AVG(stars) as avg, COUNT(*) as count FROM ratings WHERE seller_id = ?'
    ).bind(sellerId).first();

    await c.env.DB.prepare(
      'UPDATE users SET ratings_avg = ?, ratings_count = ? WHERE id = ?'
    ).bind(Math.round(avg.avg * 10) / 10, avg.count, sellerId).run();

    return c.json({ message: 'Rating submitted' }, 201);
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return c.json({ error: 'You have already rated this seller' }, 409);
    }
    return c.json({ error: 'Failed to submit rating' }, 500);
  }
});

// POST /api/reports — Report content
users.post('/reports', async (c) => {
  const user = c.get('user');
  const { targetType, targetId, reason, description } = await c.req.json();

  if (!['product', 'user'].includes(targetType)) return c.json({ error: 'Invalid target type' }, 400);
  if (!['spam', 'fake', 'inappropriate', 'scam', 'other'].includes(reason)) return c.json({ error: 'Invalid reason' }, 400);

  const id = generateId();
  await c.env.DB.prepare(
    'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, targetType, targetId, reason, description || '').run();

  return c.json({ message: 'Report submitted' }, 201);
});

export default users;
