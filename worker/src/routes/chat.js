// Chat Routes — REST endpoints for chat management
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { generateId } from '../services/jwt.js';

const chat = new Hono();
chat.use('*', authMiddleware);

// GET /api/chats — Get user's conversations
chat.get('/', async (c) => {
  const user = c.get('user');

  const { results } = await c.env.DB.prepare(
    `SELECT c.*, 
      CASE WHEN c.buyer_id = ? THEN su.name ELSE bu.name END as other_name,
      CASE WHEN c.buyer_id = ? THEN su.avatar_url ELSE bu.avatar_url END as other_avatar,
      CASE WHEN c.buyer_id = ? THEN c.seller_id ELSE c.buyer_id END as other_id,
      p.title as product_title, p.images as product_images, p.price as product_price,
      (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.status != 'read') as unread_count
     FROM chats c
     JOIN users bu ON c.buyer_id = bu.id
     JOIN users su ON c.seller_id = su.id
     LEFT JOIN products p ON c.product_id = p.id
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
  ).bind(user.id, user.id, user.id, user.id, user.id, user.id).all();

  return c.json({
    chats: results.map(chat => ({
      ...chat,
      product_images: chat.product_images ? JSON.parse(chat.product_images) : [],
    })),
  });
});

// POST /api/chats — Create or get existing conversation
chat.post('/', async (c) => {
  const user = c.get('user');
  const { sellerId, productId } = await c.req.json();

  if (!sellerId) return c.json({ error: 'Seller ID is required' }, 400);
  if (user.id === sellerId) return c.json({ error: 'Cannot chat with yourself' }, 400);

  // Check if chat already exists for this buyer-seller-product combo
  let existingChat;
  if (productId) {
    existingChat = await c.env.DB.prepare(
      'SELECT * FROM chats WHERE buyer_id = ? AND seller_id = ? AND product_id = ?'
    ).bind(user.id, sellerId, productId).first();
  }

  if (!existingChat) {
    existingChat = await c.env.DB.prepare(
      'SELECT * FROM chats WHERE buyer_id = ? AND seller_id = ? AND product_id IS NULL'
    ).bind(user.id, sellerId).first();
  }

  if (existingChat) {
    return c.json({ chat: existingChat });
  }

  // Create new chat
  const id = generateId();
  await c.env.DB.prepare(
    'INSERT INTO chats (id, buyer_id, seller_id, product_id) VALUES (?, ?, ?, ?)'
  ).bind(id, user.id, sellerId, productId || null).run();

  const newChat = await c.env.DB.prepare('SELECT * FROM chats WHERE id = ?').bind(id).first();
  return c.json({ chat: newChat }, 201);
});

// GET /api/chats/:id/messages — Get messages for a chat
chat.get('/:id/messages', async (c) => {
  const user = c.get('user');
  const chatId = c.req.param('id');
  const { before, limit = '50' } = c.req.query();

  // Verify user is participant
  const chatRecord = await c.env.DB.prepare(
    'SELECT * FROM chats WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
  ).bind(chatId, user.id, user.id).first();

  if (!chatRecord) return c.json({ error: 'Chat not found' }, 404);

  let query = 'SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.chat_id = ?';
  const params = [chatId];

  if (before) {
    query += ' AND m.created_at < ?';
    params.push(before);
  }

  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(Math.min(100, parseInt(limit)));

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Mark messages as read
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      "UPDATE messages SET status = 'read' WHERE chat_id = ? AND sender_id != ? AND status != 'read'"
    ).bind(chatId, user.id).run()
  );

  return c.json({ messages: results.reverse() });
});

// POST /api/chats/:id/messages — Send a message (REST fallback)
chat.post('/:id/messages', async (c) => {
  const user = c.get('user');
  const chatId = c.req.param('id');
  const { content, type = 'text', mediaUrl } = await c.req.json();

  // Verify user is participant
  const chatRecord = await c.env.DB.prepare(
    'SELECT * FROM chats WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
  ).bind(chatId, user.id, user.id).first();

  if (!chatRecord) return c.json({ error: 'Chat not found' }, 404);

  if (!content && type === 'text') return c.json({ error: 'Message content is required' }, 400);

  const messageId = generateId();
  await c.env.DB.prepare(
    'INSERT INTO messages (id, chat_id, sender_id, content, type, media_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(messageId, chatId, user.id, content || '', type, mediaUrl || '').run();

  // Update chat's last message
  await c.env.DB.prepare(
    "UPDATE chats SET last_message = ?, last_message_type = ?, last_sender_id = ?, last_message_at = datetime('now') WHERE id = ?"
  ).bind(
    type === 'text' ? (content || '').substring(0, 100) : `📎 ${type}`,
    type, user.id, chatId
  ).run();

  const message = await c.env.DB.prepare(
    'SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?'
  ).bind(messageId).first();

  // Notify via Durable Object if connected
  try {
    const doId = c.env.CHAT_ROOM.idFromName(chatId);
    const doStub = c.env.CHAT_ROOM.get(doId);
    await doStub.fetch(new Request('https://internal/broadcast', {
      method: 'POST',
      body: JSON.stringify({ type: 'newMessage', message }),
    }));
  } catch (e) {
    // DO not available, that's fine — message is stored
  }

  return c.json({ message }, 201);
});

// WebSocket upgrade — delegate to Durable Object
chat.get('/:id/ws', async (c) => {
  const user = c.get('user');
  const chatId = c.req.param('id');

  // Verify user is participant
  const chatRecord = await c.env.DB.prepare(
    'SELECT * FROM chats WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
  ).bind(chatId, user.id, user.id).first();

  if (!chatRecord) return c.json({ error: 'Chat not found' }, 404);

  const doId = c.env.CHAT_ROOM.idFromName(chatId);
  const doStub = c.env.CHAT_ROOM.get(doId);

  // Forward the WebSocket upgrade request to the Durable Object
  const url = new URL(c.req.url);
  url.searchParams.set('userId', user.id);
  url.searchParams.set('userName', user.id); // Will be resolved in DO

  return doStub.fetch(new Request(url.toString(), {
    headers: c.req.raw.headers,
  }));
});

export default chat;
