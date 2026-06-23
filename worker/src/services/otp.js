// OTP Service — handles generation, storage, and sending via email/SMS
import { generateId, generateOTP, hashPassword } from './jwt.js';

// Hash OTP code for storage (reuse PBKDF2 from jwt.js)
async function hashOTP(code) {
  return await hashPassword(code);
}

export async function createAndSendOTP(db, kv, userId, type, contact, contactType, env) {
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
    await sendEmailOTP(contact, code, env);
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

async function sendEmailOTP(email, code, env) {
  const RESEND_API_KEY = env?.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log(`📧 [DEV] OTP for ${email}: ${code}`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thrief <onboarding@resend.dev>',
        to: email,
        subject: 'Your Thrief Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #E84118, #ff6348); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">T</div>
            </div>
            <h2 style="text-align: center; color: #1a1a1a; margin-bottom: 10px;">Verify Your Account</h2>
            <p style="text-align: center; color: #666; margin-bottom: 25px;">Enter this code to complete your registration:</p>
            <div style="background: white; border: 2px dashed #E84118; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #E84118;">${code}</span>
            </div>
            <p style="text-align: center; color: #999; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }
  } catch (err) {
    console.error('Email send failed:', err);
    throw new Error('Failed to send verification email. Please try again.');
  }
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
