// JWT Service for Cloudflare Workers (Web Crypto API — no npm packages needed)

function base64url(source) {
  let str = '';
  const bytes = new Uint8Array(source);
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signJWT(payload, secret, expiresIn = '15m') {
  const header = { alg: 'HS256', typ: 'JWT' };

  // Parse expiry
  const now = Math.floor(Date.now() / 1000);
  let expSeconds = 900; // default 15m
  if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const val = parseInt(match[1]);
      const unit = match[2];
      expSeconds = unit === 's' ? val : unit === 'm' ? val * 60 : unit === 'h' ? val * 3600 : val * 86400;
    }
  } else if (typeof expiresIn === 'number') {
    expSeconds = expiresIn;
  }

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expSeconds,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));

  return `${signingInput}.${base64url(signature)}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = await getKey(secret);
    const encoder = new TextEncoder();
    const signatureBuffer = base64urlToBuffer(signatureB64);

    const valid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(signingInput));
    if (!valid) return null;

    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(base64urlToBuffer(payloadB64)));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// Password hashing using PBKDF2 (Workers-compatible, no bcrypt needed)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltB64 = base64url(salt);
  const hashB64 = base64url(hash);
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(password, stored) {
  const [saltB64, hashB64] = stored.split(':');
  const salt = new Uint8Array(base64urlToBuffer(saltB64));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return base64url(hash) === hashB64;
}

export function generateId() {
  return crypto.randomUUID();
}

export function generateOTP() {
  const array = crypto.getRandomValues(new Uint8Array(4));
  const num = ((array[0] << 24) | (array[1] << 16) | (array[2] << 8) | array[3]) >>> 0;
  return String(num % 900000 + 100000);
}
