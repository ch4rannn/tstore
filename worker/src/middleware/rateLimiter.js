// Rate Limiter using Cloudflare KV
export function rateLimiter({ max = 10, windowSeconds = 60, prefix = 'rl' } = {}) {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown';
    const path = c.req.path;
    const key = `${prefix}:${path}:${ip}`;

    try {
      const current = parseInt(await c.env.KV.get(key) || '0');

      if (current >= max) {
        return c.json({ error: 'Too many requests. Please try again later.' }, 429);
      }

      await c.env.KV.put(key, String(current + 1), { expirationTtl: windowSeconds });
    } catch (e) {
      // If KV fails, allow the request (fail-open)
      console.error('Rate limiter error:', e);
    }

    await next();
  };
}

// Pre-configured limiters
export const otpLimiter = rateLimiter({ max: 5, windowSeconds: 3600, prefix: 'otp' });
export const loginLimiter = rateLimiter({ max: 10, windowSeconds: 900, prefix: 'login' });
export const apiLimiter = rateLimiter({ max: 100, windowSeconds: 60, prefix: 'api' });
