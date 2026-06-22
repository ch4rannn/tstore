// Thrief API — Main Hono Application Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

// Re-export Durable Object
export { ChatRoom } from './durable-objects/ChatRoom.js';

const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: (origin, c) => {
    if (!origin) return '*'; // Allow non-browser requests (curl, etc.)
    // Whitelist: localhost dev, deployed domains
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    // Also allow the CLIENT_URL if it's set (production)
    // and any *.pages.dev for CF preview deployments
    if (allowed.includes(origin)) return origin;
    if (origin.endsWith('.pages.dev')) return origin;
    if (origin.endsWith('.loca.lt')) return origin; // localtunnel
    return null;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Health check
app.get('/', (c) => c.json({
  name: 'Thrief API',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
}));

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/users', userRoutes);
app.route('/api/chats', chatRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/upload', uploadRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: c.env.ENVIRONMENT === 'development' ? err.message : 'Internal server error',
  }, 500);
});

export default app;
