// Auth Middleware — JWT verification for Cloudflare Workers
import { verifyJWT } from '../services/jwt.js';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Check if user is banned
  const user = await c.env.DB.prepare('SELECT id, role, is_banned FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  if (user.is_banned) {
    return c.json({ error: 'Your account has been suspended' }, 403);
  }

  c.set('user', { id: payload.userId, role: user.role });
  await next();
}

export async function adminMiddleware(c, next) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}

export async function sellerMiddleware(c, next) {
  const user = c.get('user');
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return c.json({ error: 'Seller access required' }, 403);
  }
  await next();
}
