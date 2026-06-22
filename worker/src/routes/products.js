// Product Routes — CRUD, Search, Filtering
import { Hono } from 'hono';
import { authMiddleware, sellerMiddleware } from '../middleware/auth.js';
import { generateId } from '../services/jwt.js';
import { createSlug, validateCategory, validateCondition, sanitizeInput } from '../utils/validators.js';
import { verifyJWT } from '../services/jwt.js';

const products = new Hono();

// Helper: optional auth — sets user if token present, but doesn't block
async function optionalAuth(c, next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (payload) {
      c.set('user', { id: payload.userId, role: payload.role });
    }
  }
  await next();
}

// ═══ PUBLIC Routes (optional auth) ═══

// GET /api/products/featured — Homepage sections
products.get('/featured', optionalAuth, async (c) => {
  try {
    const [recent, popular] = await Promise.all([
      c.env.DB.prepare(
        `SELECT p.*, u.name as seller_name, u.avatar_url as seller_avatar 
         FROM products p JOIN users u ON p.seller_id = u.id 
         WHERE p.status = 'active' ORDER BY p.created_at DESC LIMIT 12`
      ).all(),
      c.env.DB.prepare(
        `SELECT p.*, u.name as seller_name, u.avatar_url as seller_avatar 
         FROM products p JOIN users u ON p.seller_id = u.id 
         WHERE p.status = 'active' ORDER BY p.view_count DESC LIMIT 12`
      ).all(),
    ]);

    return c.json({
      recentlyAdded: recent.results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
      popular: popular.results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch featured products' }, 500);
  }
});

// GET /api/products/search — Search with query
products.get('/search', optionalAuth, async (c) => {
  try {
    const { q, limit = '10' } = c.req.query();
    if (!q || q.length < 2) {
      return c.json({ products: [] });
    }

    const searchTerm = `%${sanitizeInput(q)}%`;
    const limitNum = Math.min(20, parseInt(limit));

    const { results } = await c.env.DB.prepare(
      `SELECT p.*, u.name as seller_name FROM products p 
       JOIN users u ON p.seller_id = u.id 
       WHERE p.status = 'active' AND (p.title LIKE ? OR p.description LIKE ?)
       ORDER BY p.created_at DESC LIMIT ?`
    ).bind(searchTerm, searchTerm, limitNum).all();

    return c.json({
      products: results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    });
  } catch (error) {
    return c.json({ error: 'Search failed' }, 500);
  }
});

// GET /api/products/seller/my — MUST be before /:slug to avoid conflict
products.get('/seller/my', authMiddleware, sellerMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { status, page = '1' } = c.req.query();

    let query = 'SELECT * FROM products WHERE seller_id = ?';
    const params = [user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 20 OFFSET ?';
    params.push((Math.max(1, parseInt(page)) - 1) * 20);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      products: results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch listings' }, 500);
  }
});

// GET /api/products — List with pagination and filters (public)
products.get('/', optionalAuth, async (c) => {
  try {
    const { category, condition, district, minPrice, maxPrice, sort, page = '1', limit = '20', status = 'active' } = c.req.query();

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT p.*, u.name as seller_name, u.avatar_url as seller_avatar, u.ratings_avg as seller_rating FROM products p JOIN users u ON p.seller_id = u.id WHERE p.status = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE status = ?';
    const params = [status];
    const countParams = [status];

    if (category) {
      query += ' AND p.category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    if (condition) {
      query += ' AND p.condition = ?';
      countQuery += ' AND condition = ?';
      params.push(condition);
      countParams.push(condition);
    }
    if (district) {
      query += ' AND p.district = ?';
      countQuery += ' AND district = ?';
      params.push(district);
      countParams.push(district);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      countQuery += ' AND price >= ?';
      params.push(parseFloat(minPrice));
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      countQuery += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
      countParams.push(parseFloat(maxPrice));
    }

    // Sort
    switch (sort) {
      case 'price-asc': query += ' ORDER BY p.price ASC'; break;
      case 'price-desc': query += ' ORDER BY p.price DESC'; break;
      case 'popular': query += ' ORDER BY p.view_count DESC'; break;
      default: query += ' ORDER BY p.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [{ results }, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(...params).all(),
      c.env.DB.prepare(countQuery).bind(...countParams).first(),
    ]);

    // Parse images JSON
    const productsWithParsedImages = results.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return c.json({
      products: productsWithParsedImages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('List products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// GET /api/products/:slug — Single product detail (public, optional auth for wishlist check)
products.get('/:slug', optionalAuth, async (c) => {
  try {
    const slug = c.req.param('slug');

    const product = await c.env.DB.prepare(
      `SELECT p.*, u.name as seller_name, u.avatar_url as seller_avatar, 
              u.district as seller_district, u.ratings_avg as seller_rating, 
              u.ratings_count as seller_ratings_count, u.response_rate as seller_response_rate,
              u.created_at as seller_joined
       FROM products p JOIN users u ON p.seller_id = u.id 
       WHERE p.slug = ?`
    ).bind(slug).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Increment view count (fire and forget)
    c.executionCtx.waitUntil(
      c.env.DB.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').bind(product.id).run()
    );

    // Check if user wishlisted this product (only if authenticated)
    let wishlisted = null;
    const user = c.get('user');
    if (user) {
      wishlisted = await c.env.DB.prepare(
        'SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?'
      ).bind(user.id, product.id).first();
    }

    // Get similar products
    const { results: similar } = await c.env.DB.prepare(
      `SELECT p.*, u.name as seller_name FROM products p 
       JOIN users u ON p.seller_id = u.id 
       WHERE p.category = ? AND p.id != ? AND p.status = 'active'
       ORDER BY p.created_at DESC LIMIT 6`
    ).bind(product.category, product.id).all();

    return c.json({
      product: { ...product, images: JSON.parse(product.images || '[]') },
      isWishlisted: !!wishlisted,
      similarProducts: similar.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    });
  } catch (error) {
    console.error('Product detail error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// ═══ PROTECTED Routes (require auth) ═══

// POST /api/products — Create product (seller only)
products.post('/', authMiddleware, sellerMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { title, description, category, subCategory, condition, price, negotiable, images, video, district, contactPreference } = body;

    // Validate
    if (!title || title.length < 3) return c.json({ error: 'Title must be at least 3 characters' }, 400);
    if (!description || description.length < 10) return c.json({ error: 'Description must be at least 10 characters' }, 400);
    if (!validateCategory(category)) return c.json({ error: 'Invalid category' }, 400);
    if (!validateCondition(condition)) return c.json({ error: 'Invalid condition' }, 400);
    if (!price || price <= 0) return c.json({ error: 'Price must be positive' }, 400);
    if (!district) return c.json({ error: 'Location is required' }, 400);

    // Check for confirmed payment (Rs 5 listing fee)
    const payment = await c.env.DB.prepare(
      `SELECT id FROM payments WHERE seller_id = ? AND status = 'confirmed' AND product_id IS NULL ORDER BY created_at DESC LIMIT 1`
    ).bind(user.id).first();

    // Generate unique slug
    let baseSlug = createSlug(title);
    let slug = baseSlug;
    let count = 0;
    while (await c.env.DB.prepare('SELECT 1 FROM products WHERE slug = ?').bind(slug).first()) {
      count++;
      slug = `${baseSlug}-${count}`;
    }

    const id = generateId();
    await c.env.DB.prepare(
      `INSERT INTO products (id, title, slug, description, category, sub_category, condition, price, negotiable, images, video_url, seller_id, district, contact_preference, status, payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      sanitizeInput(title),
      slug,
      sanitizeInput(description),
      category,
      subCategory || '',
      condition,
      price,
      negotiable ? 1 : 0,
      JSON.stringify(images || []),
      video || '',
      user.id,
      district,
      contactPreference || 'chat',
      'pending',
      payment ? payment.id : null
    ).run();

    // Link payment to product
    if (payment) {
      await c.env.DB.prepare('UPDATE payments SET product_id = ? WHERE id = ?').bind(id, payment.id).run();
    }

    return c.json({ message: 'Product submitted for review', product: { id, slug } }, 201);
  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

// PUT /api/products/:id — Update own product
products.put('/:id', authMiddleware, sellerMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?')
      .bind(productId, user.id).first();

    if (!existing) return c.json({ error: 'Product not found or unauthorized' }, 404);

    const updates = [];
    const values = [];

    if (body.title) { updates.push('title = ?'); values.push(sanitizeInput(body.title)); }
    if (body.description) { updates.push('description = ?'); values.push(sanitizeInput(body.description)); }
    if (body.price) { updates.push('price = ?'); values.push(body.price); }
    if (body.negotiable !== undefined) { updates.push('negotiable = ?'); values.push(body.negotiable ? 1 : 0); }
    if (body.images) { updates.push('images = ?'); values.push(JSON.stringify(body.images)); }
    if (body.condition) { updates.push('condition = ?'); values.push(body.condition); }
    if (body.district) { updates.push('district = ?'); values.push(body.district); }

    updates.push("updated_at = datetime('now')");

    if (updates.length === 1) return c.json({ error: 'No fields to update' }, 400);

    values.push(productId);
    await c.env.DB.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    return c.json({ message: 'Product updated' });
  } catch (error) {
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// DELETE /api/products/:id — Remove own product
products.delete('/:id', authMiddleware, sellerMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');

    const result = await c.env.DB.prepare(
      "UPDATE products SET status = 'removed', updated_at = datetime('now') WHERE id = ? AND seller_id = ?"
    ).bind(productId, user.id).run();

    if (result.meta.changes === 0) return c.json({ error: 'Product not found' }, 404);
    return c.json({ message: 'Product removed' });
  } catch (error) {
    return c.json({ error: 'Failed to remove product' }, 500);
  }
});

export default products;
