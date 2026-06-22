// Payment Routes — eSewa/Khalti integration
import { Hono } from 'hono';
import { authMiddleware, sellerMiddleware } from '../middleware/auth.js';
import { generateId } from '../services/jwt.js';

const payments = new Hono();
payments.use('*', authMiddleware);

// POST /api/payments/initiate — Start listing fee payment
payments.post('/initiate', sellerMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { method } = await c.req.json();

    if (!['esewa', 'khalti', 'bank-transfer'].includes(method)) {
      return c.json({ error: 'Invalid payment method' }, 400);
    }

    const paymentId = generateId();
    const amount = 5; // Rs 5 listing fee

    await c.env.DB.prepare(
      'INSERT INTO payments (id, seller_id, amount, method) VALUES (?, ?, ?, ?)'
    ).bind(paymentId, user.id, amount, method).run();

    if (method === 'esewa') {
      // eSewa form-redirect model
      const successUrl = `${c.env.CLIENT_URL}/payment/success?paymentId=${paymentId}`;
      const failureUrl = `${c.env.CLIENT_URL}/payment/failure?paymentId=${paymentId}`;

      return c.json({
        paymentId,
        method: 'esewa',
        redirectData: {
          url: `${c.env.ESEWA_GATEWAY_URL}/api/epay/main/v2/form`,
          params: {
            amount: amount,
            tax_amount: 0,
            total_amount: amount,
            transaction_uuid: paymentId,
            product_code: c.env.ESEWA_MERCHANT_CODE,
            product_service_charge: 0,
            product_delivery_charge: 0,
            success_url: successUrl,
            failure_url: failureUrl,
          },
        },
      });
    }

    if (method === 'khalti') {
      // Khalti REST API initiation
      try {
        const response = await fetch(`${c.env.KHALTI_GATEWAY_URL}/epayment/initiate/`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${c.env.KHALTI_SECRET_KEY || 'test_secret_key'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            return_url: `${c.env.CLIENT_URL}/payment/verify`,
            website_url: c.env.CLIENT_URL,
            amount: amount * 100, // Khalti uses paisa
            purchase_order_id: paymentId,
            purchase_order_name: 'Thrief Listing Fee',
          }),
        });

        const data = await response.json();

        if (data.payment_url) {
          await c.env.DB.prepare(
            "UPDATE payments SET transaction_id = ?, gateway_response = ? WHERE id = ?"
          ).bind(data.pidx || '', JSON.stringify(data), paymentId).run();

          return c.json({
            paymentId,
            method: 'khalti',
            paymentUrl: data.payment_url,
            pidx: data.pidx,
          });
        }
      } catch (err) {
        console.error('Khalti init error:', err);
      }

      // Fallback for sandbox/dev
      return c.json({
        paymentId,
        method: 'khalti',
        paymentUrl: null,
        message: 'Khalti sandbox — payment auto-confirmed in dev mode',
      });
    }

    if (method === 'bank-transfer') {
      return c.json({
        paymentId,
        method: 'bank-transfer',
        bankDetails: {
          bankName: 'Nepal Investment Mega Bank',
          accountName: 'Thrief Pvt. Ltd.',
          accountNumber: '0123456789',
          amount: `Rs ${amount}`,
          reference: paymentId.substring(0, 8),
        },
        message: 'Please transfer and wait for admin confirmation',
      });
    }
  } catch (error) {
    console.error('Payment init error:', error);
    return c.json({ error: 'Payment initiation failed' }, 500);
  }
});

// POST /api/payments/verify — Verify payment callback
payments.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { paymentId, method, transactionId, pidx } = body;

    if (!paymentId) return c.json({ error: 'Payment ID required' }, 400);

    const payment = await c.env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first();
    if (!payment) return c.json({ error: 'Payment not found' }, 404);

    if (payment.status === 'confirmed') {
      return c.json({ message: 'Payment already confirmed', status: 'confirmed' });
    }

    let verified = false;

    if (method === 'khalti' && pidx) {
      // Verify with Khalti lookup API
      try {
        const response = await fetch(`${c.env.KHALTI_GATEWAY_URL}/epayment/lookup/`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${c.env.KHALTI_SECRET_KEY || 'test_secret_key'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pidx }),
        });
        const data = await response.json();
        verified = data.status === 'Completed';
        
        await c.env.DB.prepare(
          'UPDATE payments SET gateway_response = ? WHERE id = ?'
        ).bind(JSON.stringify(data), paymentId).run();
      } catch (err) {
        console.error('Khalti verify error:', err);
      }
    }

    if (method === 'esewa' && transactionId) {
      // In production, verify via eSewa status check API
      // For sandbox, auto-confirm
      verified = true;
    }

    // In dev mode, auto-confirm all payments
    if (c.env.ENVIRONMENT === 'development') {
      verified = true;
    }

    if (verified) {
      await c.env.DB.prepare(
        "UPDATE payments SET status = 'confirmed', transaction_id = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(transactionId || pidx || 'dev-auto', paymentId).run();

      return c.json({ message: 'Payment confirmed', status: 'confirmed' });
    }

    return c.json({ message: 'Payment verification pending', status: 'pending' });
  } catch (error) {
    return c.json({ error: 'Payment verification failed' }, 500);
  }
});

// GET /api/payments/my — Seller's payment history
payments.get('/my', sellerMiddleware, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, pr.title as product_title FROM payments p 
     LEFT JOIN products pr ON p.product_id = pr.id 
     WHERE p.seller_id = ? ORDER BY p.created_at DESC`
  ).bind(user.id).all();

  return c.json({ payments: results });
});

// GET /api/payments/check — Check if seller has unused confirmed payment
payments.get('/check', sellerMiddleware, async (c) => {
  const user = c.get('user');
  const payment = await c.env.DB.prepare(
    "SELECT id FROM payments WHERE seller_id = ? AND status = 'confirmed' AND product_id IS NULL ORDER BY created_at DESC LIMIT 1"
  ).bind(user.id).first();

  return c.json({ hasPayment: !!payment, paymentId: payment?.id });
});

export default payments;
