// Admin Routes — Dashboard, Product/User/Payment/Report Management
import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { hashPassword, generateId } from '../services/jwt.js';

const admin = new Hono();
admin.use('*', authMiddleware);
admin.use('*', adminMiddleware);

// GET /api/admin/dashboard — Stats
admin.get('/dashboard', async (c) => {
  try {
    const [totalProducts, activeProducts, pendingProducts, totalUsers, totalPayments, totalReports, totalMessages, monthProducts, monthRevenue] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM products').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'pending'").first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role != \'admin\'').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'confirmed'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM messages').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM products WHERE created_at >= datetime('now', '-30 days')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'confirmed' AND created_at >= datetime('now', '-30 days')").first(),
    ]);

    return c.json({
      stats: {
        totalProducts: totalProducts.count,
        activeProducts: activeProducts.count,
        pendingApprovals: pendingProducts.count,
        totalUsers: totalUsers.count,
        totalPaymentsCount: totalPayments.count,
        totalRevenue: totalPayments.total,
        pendingReports: totalReports.count,
        totalMessages: totalMessages.count,
        monthlyProducts: monthProducts.count,
        monthlyRevenue: monthRevenue.total,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// GET /api/admin/products — All products with filters
admin.get('/products', async (c) => {
  const { status, category, page = '1', search } = c.req.query();
  const pageNum = Math.max(1, parseInt(page));
  const offset = (pageNum - 1) * 20;

  let query = 'SELECT p.*, u.name as seller_name, u.email as seller_email FROM products p JOIN users u ON p.seller_id = u.id WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as count FROM products p JOIN users u ON p.seller_id = u.id WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) { query += ' AND p.status = ?'; countQuery += ' AND p.status = ?'; params.push(status); countParams.push(status); }
  if (category) { query += ' AND p.category = ?'; countQuery += ' AND p.category = ?'; params.push(category); countParams.push(category); }
  if (search) { query += ' AND (p.title LIKE ? OR u.name LIKE ?)'; countQuery += ' AND (p.title LIKE ? OR u.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); countParams.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY p.created_at DESC LIMIT 20 OFFSET ?';
  params.push(offset);

  const [{ results }, total] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all(),
    c.env.DB.prepare(countQuery).bind(...countParams).first(),
  ]);

  return c.json({
    products: results.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
    total: total.count,
    page: pageNum,
    totalPages: Math.ceil(total.count / 20),
  });
});

// PUT /api/admin/products/:id — Update product status
admin.put('/products/:id', async (c) => {
  const productId = c.req.param('id');
  const { status, reason } = await c.req.json();

  if (!['pending', 'active', 'sold', 'removed'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE products SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, productId).run();

  return c.json({ message: `Product status updated to ${status}` });
});

// GET /api/admin/users/stats — User Statistics (MUST be before /users/:id routes)
admin.get('/users/stats', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as buyers,
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as sellers,
        SUM(CASE WHEN is_banned = 0 AND is_verified = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned,
        SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as unverified
      FROM users WHERE role != 'admin'
    `).first();
    return c.json({ stats });
  } catch (error) {
    return c.json({ error: 'Failed to fetch user stats' }, 500);
  }
});

// GET /api/admin/users — All users
admin.get('/users', async (c) => {
  const { role, search, page = '1' } = c.req.query();
  const offset = (Math.max(1, parseInt(page)) - 1) * 20;

  let query = "SELECT id, name, email, phone, role, avatar_url, district, is_verified, is_banned, ban_reason, ratings_avg, ratings_count, created_at FROM users WHERE role != 'admin'";
  const params = [];

  if (role) { query += ' AND role = ?'; params.push(role); }
  if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  query += ' ORDER BY created_at DESC LIMIT 20 OFFSET ?';
  params.push(offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ users: results });
});

// PUT /api/admin/users/:id/ban — Ban/unban user
admin.put('/users/:id/ban', async (c) => {
  const userId = c.req.param('id');
  const { banned, reason } = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE users SET is_banned = ?, ban_reason = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(banned ? 1 : 0, reason || '', userId).run();

  // If banning, invalidate their refresh token
  if (banned) {
    await c.env.KV.delete(`refresh:${userId}`);
  }

  return c.json({ message: banned ? 'User banned' : 'User unbanned' });
});

// GET /api/admin/users/:id/details — Detailed user info for modal
admin.get('/users/:id/details', async (c) => {
  const userId = c.req.param('id');
  try {
    const user = await c.env.DB.prepare("SELECT id, name, email, phone, role, avatar_url, district, is_verified, is_banned, ban_reason, ratings_avg, ratings_count, created_at FROM users WHERE id = ?").bind(userId).first();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const [productsCount, chatsCount, reportsAgainst] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM products WHERE seller_id = ?").bind(userId).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM chats WHERE buyer_id = ? OR seller_id = ?").bind(userId, userId).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM reports WHERE target_type = 'user' AND target_id = ?").bind(userId).first(),
    ]);

    return c.json({
      user,
      activity: {
        totalListings: productsCount.count,
        totalChats: chatsCount.count,
        reportsAgainst: reportsAgainst.count
      }
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// PUT /api/admin/users/:id/reset-password — Admin password reset with random temp password
admin.put('/users/:id/reset-password', async (c) => {
  const userId = c.req.param('id');
  try {
    // Generate a random 12-char temp password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const array = crypto.getRandomValues(new Uint8Array(12));
    const newPassword = Array.from(array, b => chars[b % chars.length]).join('');
    
    const passwordHash = await hashPassword(newPassword);
    
    await c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, userId).run();
    await c.env.KV.delete(`refresh:${userId}`); // Invalidate sessions
    
    return c.json({ message: 'Password reset successfully', tempPassword: newPassword });
  } catch (error) {
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// DELETE /api/admin/users/:id — Anonymize user (soft delete)
admin.delete('/users/:id', async (c) => {
  const userId = c.req.param('id');
  try {
    // Soft delete / anonymize to preserve chat integrity
    await c.env.DB.prepare(`
      UPDATE users 
      SET name = 'Deleted User', email = NULL, phone = NULL, avatar_url = '', 
          is_banned = 1, ban_reason = 'Account Deleted by Admin', updated_at = datetime('now')
      WHERE id = ?
    `).bind(userId).run();
    
    // Remove their products
    await c.env.DB.prepare("UPDATE products SET status = 'removed' WHERE seller_id = ?").bind(userId).run();
    
    await c.env.KV.delete(`refresh:${userId}`);
    return c.json({ message: 'User deleted and anonymized' });
  } catch (error) {
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// GET /api/admin/payments/export — CSV export (MUST be before /payments to match first)
admin.get('/payments/export', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT p.*, u.name as seller_name, u.email as seller_email FROM payments p JOIN users u ON p.seller_id = u.id ORDER BY p.created_at DESC'
  ).all();

  let csv = 'ID,Seller,Email,Amount,Method,Status,Transaction ID,Date\n';
  for (const p of results) {
    csv += `${p.id},"${(p.seller_name || '').replace(/"/g, '""')}",${p.seller_email || ''},${p.amount},${p.method},${p.status},${p.transaction_id || ''},${p.created_at}\n`;
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=thrief-payments.csv',
    },
  });
});

// GET /api/admin/payments — All payments (with pagination metadata)
admin.get('/payments', async (c) => {
  const { status, method, page = '1' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page));
  const offset = (pageNum - 1) * 20;

  let query = 'SELECT p.*, u.name as seller_name, u.email as seller_email, pr.title as product_title FROM payments p JOIN users u ON p.seller_id = u.id LEFT JOIN products pr ON p.product_id = pr.id WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as count FROM payments p WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) { query += ' AND p.status = ?'; countQuery += ' AND p.status = ?'; params.push(status); countParams.push(status); }
  if (method) { query += ' AND p.method = ?'; countQuery += ' AND p.method = ?'; params.push(method); countParams.push(method); }

  query += ' ORDER BY p.created_at DESC LIMIT 20 OFFSET ?';
  params.push(offset);

  const [{ results }, total] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all(),
    c.env.DB.prepare(countQuery).bind(...countParams).first(),
  ]);

  return c.json({ payments: results, total: total.count, page: pageNum, totalPages: Math.ceil(total.count / 20) });
});

// PUT /api/admin/payments/:id/confirm — Manual payment confirmation (with updated_at)
admin.put('/payments/:id/confirm', async (c) => {
  const paymentId = c.req.param('id');
  await c.env.DB.prepare(
    "UPDATE payments SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?"
  ).bind(paymentId).run();
  return c.json({ message: 'Payment confirmed' });
});

// GET /api/admin/reports — All reports (with pagination metadata)
admin.get('/reports', async (c) => {
  const { status = 'pending', page = '1' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page));
  const offset = (pageNum - 1) * 20;

  const [{ results }, total] = await Promise.all([
    c.env.DB.prepare(
      `SELECT r.*, u.name as reporter_name FROM reports r 
       JOIN users u ON r.reporter_id = u.id 
       WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 20 OFFSET ?`
    ).bind(status, offset).all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM reports WHERE status = ?').bind(status).first(),
  ]);

  return c.json({ reports: results, total: total.count, page: pageNum, totalPages: Math.ceil(total.count / 20) });
});

// PUT /api/admin/reports/:id — Update report
admin.put('/reports/:id', async (c) => {
  const reportId = c.req.param('id');
  const { status, adminNote } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE reports SET status = ?, admin_note = ? WHERE id = ?'
  ).bind(status, adminNote || '', reportId).run();

  return c.json({ message: 'Report updated' });
});

export default admin;
