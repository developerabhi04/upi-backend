import { v4 as uuidv4 } from 'uuid';
import PaymentConfig from '../Model/PaymentModel.js';

const paymentSessions = new Map();
const IP_RATE_LIMIT    = new Map();

// Cleanup old sessions & rate-limits
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of paymentSessions) {
    if (now - s.created > 15 * 60 * 1000) paymentSessions.delete(id);
  }
  for (const [ip, entry] of IP_RATE_LIMIT) {
    if (now - entry.timestamp > 60 * 60 * 1000) IP_RATE_LIMIT.delete(ip);
  }
}, 60 * 1000);

const NATURAL_VARIATION = {
  getVariedAmount: (amount) => {
    const base = parseFloat(amount);
    const variation = Math.min(base * 0.03, 15);
    const varied = base + (Math.random() * variation * 2 - variation);
    return Math.max(1, Math.min(2000, Number(varied.toFixed(2))));
  }
};

export const setPaymentConfig = async (req, res) => {
  try {
    const { payeeVpa, payeeName, mcc, gstin, merchantCategory } = req.body;
    if (!/^\d{10}@idfcbank$/.test(payeeVpa)) {
      return res.status(400).json({ error: 'Invalid IDFC Bank VPA. Must be 10 digits followed by @idfcbank' });
    }
    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { payeeVpa, payeeName, mcc, gstin, merchantCategory, isMerchantAccount: true },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (error) {
    console.error('[setPaymentConfig]', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne({});
    if (!config) {
      return res.status(404).json({ error: 'No payment configuration found. Please configure merchant details first.' });
    }
    res.json(config);
  } catch (error) {
    console.error('[getPaymentConfig]', error);
    res.status(500).json({ error: 'Server error while fetching payment configuration' });
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipEntry = IP_RATE_LIMIT.get(ip) || { count: 0, timestamp: Date.now() };
    if (ipEntry.count >= 5) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { amount, orderId } = req.body;
    const safeAmount  = NATURAL_VARIATION.getVariedAmount(amount);
    const safeOrderId = `${orderId}_${uuidv4().substr(0, 8)}`;

    if (safeAmount > 2000 || safeAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const config = await PaymentConfig.findOne();
    if (!config?.payeeVpa || !config.payeeName) {
      return res.status(400).json({ error: 'Merchant not configured' });
    }

    const sessionId = `sess_${Date.now()}_${uuidv4().substr(0, 6)}`;
    paymentSessions.set(sessionId, {
      amount:   safeAmount,
      orderId:  safeOrderId,
      status:   'pending',
      created:  Date.now(),
      config:   { payeeVpa: config.payeeVpa, payeeName: config.payeeName, mcc: config.mcc, isIDFC: config.payeeVpa.endsWith('@idfcbank') },
      attempts: 0,
      ip
    });

    IP_RATE_LIMIT.set(ip, { count: ipEntry.count + 1, timestamp: Date.now() });

    res.json({ sessionId, orderId: safeOrderId, amount: safeAmount, payeeVpa: config.payeeVpa, payeeName: config.payeeName });
  } catch (error) {
    console.error('[initiatePayment]', error);
    res.status(500).json({ error: 'Payment initiation failed', details: error.message });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Invalid or expired session' });

    session.attempts++;
    if (session.attempts >= 3 || Math.random() > 0.7) {
      session.status = 'success';
      session.utr    = `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;
      session.timestamp = new Date();
    }

    res.json({
      status: session.status,
      utr:    session.utr,
      amount: session.amount,
      timestamp: session.timestamp,
      payeeVpa: session.config.payeeVpa,
      payeeName: session.config.payeeName
    });
  } catch (error) {
    console.error('[checkPaymentStatus]', error);
    res.status(500).json({ error: 'Status check failed: ' + error.message });
  }
};
