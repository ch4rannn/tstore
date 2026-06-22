// OTP Service — handles generation, storage, and sending via email/SMS
import { generateId, generateOTP, hashPassword } from './jwt.js';

// Hash OTP code for storage (reuse PBKDF2 from jwt.js)
async function hashOTP(code) {
  return await hashPassword(code);
}

export async function createAndSendOTP(db, kv, userId, type, contact, contactType) {
  // Rate limiting: max 3 OTPs per hour
  const rateLimitKey = `otp_rate:${contact}`;
  const currentCount = parseInt(await kv.get(rateLimitKey) || '0');
  if (currentCount >= 3) {
    throw new Error('Too many OTP requests. Please try again later.');
  }

  // Delete existing OTPs for this user and type
  await db.prepare('DELETE FROM otps WHERE user_id = ? AND type = ?').bind(userId, type).run();

  // Generate OTP
  const code = generateOTP();
  const codeHash = await hashOTP(code);
  const id = generateId();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Store in D1
  await db.prepare(
    'INSERT INTO otps (id, user_id, code_hash, type, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, codeHash, type, expiresAt).run();

  // Update rate limit counter in KV
  await kv.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 3600 });

  // Send OTP
  if (contactType === 'email') {
    await sendEmailOTP(contact, code);
  } else {
    await sendSmsOTP(contact, code);
  }

  return { success: true, message: `OTP sent to ${contactType}` };
}

export async function verifyOTPCode(db, userId, type, code) {
  const otp = await db.prepare(
    'SELECT * FROM otps WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(userId, type).first();

  if (!otp) {
    throw new Error('No OTP found. Please request a new one.');
  }

  // Check expiry
  if (new Date(otp.expires_at) < new Date()) {
    await db.prepare('DELETE FROM otps WHERE id = ?').bind(otp.id).run();
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Check attempts
  if (otp.attempts >= 5) {
    await db.prepare('DELETE FROM otps WHERE id = ?').bind(otp.id).run();
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // Verify code using PBKDF2
  const { verifyPassword } = await import('./jwt.js');
  const isValid = await verifyPassword(code, otp.code_hash);

  if (!isValid) {
    await db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').bind(otp.id).run();
    throw new Error('Invalid OTP code.');
  }

  // Delete used OTP
  await db.prepare('DELETE FROM otps WHERE id = ?').bind(otp.id).run();
  return true;
}

async function sendEmailOTP(email, code) {
  // In development, log to console. In production, use Resend API.
  console.log(`📧 [DEV] OTP for ${email}: ${code}`);

  // Production example with Resend:
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'Thrief <noreply@thrief.com>',
  //     to: email,
  //     subject: 'Your Thrief Verification Code',
  //     html: `<h2>Your verification code is: <strong>${code}</strong></h2><p>This code expires in 5 minutes.</p>`,
  //   }),
  // });
}

async function sendSmsOTP(phone, code) {
  // In development, log to console. In production, use Twilio.
  console.log(`📱 [DEV] OTP for ${phone}: ${code}`);

  // Production example with Twilio:
  // const twilioSid = TWILIO_SID;
  // const twilioAuth = TWILIO_AUTH;
  // await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: new URLSearchParams({
  //     To: `+977${phone}`,
  //     From: TWILIO_PHONE,
  //     Body: `Your Thrief verification code is: ${code}. Expires in 5 minutes.`,
  //   }),
  // });
}
