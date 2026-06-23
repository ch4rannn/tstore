// Auth Routes — Register, Login, OTP, Password Reset
import { Hono } from 'hono';
import { signJWT, verifyJWT, hashPassword, verifyPassword, generateId } from '../services/jwt.js';
import { createAndSendOTP, verifyOTPCode } from '../services/otp.js';
import { validateEmail, validatePhone, validatePassword, validateRole, sanitizeInput } from '../utils/validators.js';
import { loginLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const auth = new Hono();

// POST /api/auth/register
auth.post('/register', otpLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, password, role } = body;

    // Validate
    if (!name || name.trim().length < 2) {
      return c.json({ error: 'Name must be at least 2 characters' }, 400);
    }
    if (!email && !phone) {
      return c.json({ error: 'Email or phone is required' }, 400);
    }
    if (email && !validateEmail(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    if (phone && !validatePhone(phone)) {
      return c.json({ error: 'Phone must be 10 digits starting with 97 or 98' }, 400);
    }
    if (!validatePassword(password)) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    if (!validateRole(role)) {
      return c.json({ error: 'Role must be buyer or seller' }, 400);
    }

    // Check if user exists
    if (email) {
      const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
      if (existing) return c.json({ error: 'Email already registered' }, 409);
    }
    if (phone) {
      const existing = await c.env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
      if (existing) return c.json({ error: 'Phone number already registered' }, 409);
    }

    // Create user
    const id = generateId();
    const passwordHash = await hashPassword(password);

    await c.env.DB.prepare(
      'INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      sanitizeInput(name),
      email ? email.toLowerCase() : null,
      phone || null,
      passwordHash,
      role
    ).run();

    // Send OTP
    const contact = email || phone;
    const contactType = email ? 'email' : 'phone';
    await createAndSendOTP(c.env.DB, c.env.KV, id, 'registration', contact, contactType, c.env);

    return c.json({
      message: 'Registration successful. Please verify your OTP.',
      userId: id,
      contactType,
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: error.message || 'Registration failed' }, 500);
  }
});

// POST /api/auth/verify-otp
auth.post('/verify-otp', async (c) => {
  try {
    const { userId, code } = await c.req.json();

    if (!userId || !code) {
      return c.json({ error: 'User ID and OTP code are required' }, 400);
    }

    await verifyOTPCode(c.env.DB, userId, 'registration', code);

    // Mark user as verified
    await c.env.DB.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').bind(userId).run();

    // Generate tokens
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    const accessToken = await signJWT({ userId: user.id, role: user.role }, c.env.JWT_SECRET, '15m');
    const refreshToken = await signJWT({ userId: user.id }, c.env.JWT_REFRESH_SECRET, '7d');

    // Store refresh token in KV
    await c.env.KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 7 * 86400 });

    return c.json({
      message: 'Account verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        district: user.district,
        is_verified: 1,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return c.json({ error: error.message || 'OTP verification failed' }, 400);
  }
});

// POST /api/auth/login
auth.post('/login', loginLimiter, async (c) => {
  try {
    const { email, phone, password } = await c.req.json();

    if (!email && !phone) {
      return c.json({ error: 'Email or phone is required' }, 400);
    }
    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    // Find user
    let user;
    if (email) {
      user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    } else {
      user = await c.env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
    }

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (user.is_banned) {
      return c.json({ error: 'Your account has been suspended. Reason: ' + (user.ban_reason || 'Policy violation') }, 403);
    }

    if (!user.is_verified) {
      return c.json({ error: 'Please verify your account first', needsVerification: true, userId: user.id }, 403);
    }

    // Check password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate tokens
    const accessToken = await signJWT({ userId: user.id, role: user.role }, c.env.JWT_SECRET, '15m');
    const refreshToken = await signJWT({ userId: user.id }, c.env.JWT_REFRESH_SECRET, '7d');

    await c.env.KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 7 * 86400 });

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        district: user.district,
        is_verified: user.is_verified,
        ratings_avg: user.ratings_avg,
        ratings_count: user.ratings_count,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    if (!refreshToken) {
      return c.json({ error: 'Refresh token required' }, 400);
    }

    const payload = await verifyJWT(refreshToken, c.env.JWT_REFRESH_SECRET);
    if (!payload) {
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    // Check if token matches stored token
    const storedToken = await c.env.KV.get(`refresh:${payload.userId}`);
    if (storedToken !== refreshToken) {
      return c.json({ error: 'Refresh token revoked' }, 401);
    }

    // Get user role
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(payload.userId).first();
    if (!user) return c.json({ error: 'User not found' }, 401);

    // Rotate tokens
    const newAccessToken = await signJWT({ userId: payload.userId, role: user.role }, c.env.JWT_SECRET, '15m');
    const newRefreshToken = await signJWT({ userId: payload.userId }, c.env.JWT_REFRESH_SECRET, '7d');

    await c.env.KV.put(`refresh:${payload.userId}`, newRefreshToken, { expirationTtl: 7 * 86400 });

    return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return c.json({ error: 'Token refresh failed' }, 500);
  }
});

// POST /api/auth/forgot-password
auth.post('/forgot-password', otpLimiter, async (c) => {
  try {
    const { email, phone } = await c.req.json();

    let user;
    const contact = email || phone;
    const contactType = email ? 'email' : 'phone';

    if (email) {
      user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    } else if (phone) {
      user = await c.env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
    }

    if (!user) {
      // Don't reveal whether user exists
      return c.json({ message: 'If the account exists, an OTP has been sent.' });
    }

    await createAndSendOTP(c.env.DB, c.env.KV, user.id, 'password-reset', contact, contactType, c.env);
    return c.json({ message: 'If the account exists, an OTP has been sent.', userId: user.id });
  } catch (error) {
    return c.json({ error: error.message || 'Failed to send reset OTP' }, 500);
  }
});

// POST /api/auth/reset-password
auth.post('/reset-password', async (c) => {
  try {
    const { userId, code, newPassword } = await c.req.json();

    if (!validatePassword(newPassword)) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    await verifyOTPCode(c.env.DB, userId, 'password-reset', code);

    const passwordHash = await hashPassword(newPassword);
    await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(passwordHash, userId).run();

    // Invalidate refresh tokens
    await c.env.KV.delete(`refresh:${userId}`);

    return c.json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    return c.json({ error: error.message || 'Password reset failed' }, 400);
  }
});

// POST /api/auth/resend-otp
auth.post('/resend-otp', otpLimiter, async (c) => {
  try {
    const { userId, type = 'registration' } = await c.req.json();

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const contact = user.email || user.phone;
    const contactType = user.email ? 'email' : 'phone';

    await createAndSendOTP(c.env.DB, c.env.KV, userId, type, contact, contactType, c.env);
    return c.json({ message: 'OTP resent successfully' });
  } catch (error) {
    return c.json({ error: error.message || 'Failed to resend OTP' }, 500);
  }
});

// POST /api/auth/bootstrap-admin — Create admin from env vars (one-time only)
auth.post('/bootstrap-admin', async (c) => {
  try {
    // Block if ANY admin already exists (one-time bootstrap)
    const anyAdmin = await c.env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();
    if (anyAdmin) {
      return c.json({ message: 'Admin account already exists' });
    }

    const adminEmail = c.env.ADMIN_EMAIL;
    const adminPassword = c.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return c.json({ error: 'Admin env vars not configured' }, 400);
    }

    const id = generateId();
    const passwordHash = await hashPassword(adminPassword);

    await c.env.DB.prepare(
      'INSERT INTO users (id, name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, 'Admin', adminEmail, passwordHash, 'admin', 1).run();

    return c.json({ message: 'Admin account created', adminId: id }, 201);
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    return c.json({ error: 'Failed to create admin account' }, 500);
  }
});

// POST /api/auth/logout — Revoke refresh token
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      if (payload?.userId) {
        await c.env.KV.delete(`refresh:${payload.userId}`);
      }
    }
    return c.json({ message: 'Logged out successfully' });
  } catch {
    return c.json({ message: 'Logged out' });
  }
});

export default auth;
