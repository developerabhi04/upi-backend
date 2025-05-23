import PaymentConfig from '../Model/PaymentModel.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const paymentSessions = new Map();
const transactionHistory = new Map();
const IP_RATE_LIMIT = new Map();



// Cleanup jobs
setInterval(() => {
  const now = Date.now();
  // Clear old sessions (15 minutes)
  for (const [sessionId, session] of paymentSessions) {
    if (now - session.created > 900000) paymentSessions.delete(sessionId);
  }
  // Clear IP history (1 hour)
  for (const [ip, entry] of IP_RATE_LIMIT) {
    if (now - entry.timestamp > 3600000) IP_RATE_LIMIT.delete(ip);
  }
}, 60000);


// Enhanced natural variation with more realistic patterns
const NATURAL_VARIATION = {
  getVariedAmount: (amount) => {
    const base = parseFloat(amount);
    // More natural variation (1-5% or ₹5-20)
    const variation = Math.min(base * (0.01 + Math.random() * 0.04), 20); 
    const varied = base + (Math.random() * variation * 2 - variation);
    return Math.max(1, Math.min(2000, Number(varied.toFixed(2))))
  },
  randomDelay: () => 1000 + Math.random() * 7000, // 1-8 second delay
  generateCustomerRef: () => `CUST${Math.floor(10000 + Math.random() * 90000)}`,
  generateTxnNote: () => {
    const notes = [
      "Online purchase",
      "Merchant payment",
      "Shopping",
      "Service fee",
      "Subscription"
    ];
    return notes[Math.floor(Math.random() * notes.length)];
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
      { 
        payeeVpa, 
        payeeName, 
        mcc, 
        gstin,
        merchantCategory,
        isMerchantAccount: true // Force merchant account
      },
      { upsert: true, new: true }
    );

    res.json(config);
  } catch (error) {
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
    res.status(500).json({ error: 'Server error while fetching payment configuration' });
  }
};


export const initiatePayment = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip;
    
    // More permissive rate limiting
    const rateLimitKey = `limit_${ip}`;
    if (IP_RATE_LIMIT.has(rateLimitKey)) {
      const entry = IP_RATE_LIMIT.get(rateLimitKey);
      if (Date.now() - entry.timestamp < 60000 && entry.count >= 5) {
        return res.status(429).json({ 
          error: 'Too many requests. Please try again in a minute.' 
        });
      }
    }

    // Validate input
    if (!req.body.amount || !req.body.orderId) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount and orderId' 
      });
    }

    const config = await PaymentConfig.findOne().lean();
    if (!config) {
      return res.status(400).json({ error: 'Merchant not configured' });
    }

    // Create more natural session data
    const sessionId = `sess_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const customerRef = NATURAL_VARIATION.generateCustomerRef();
    const txnNote = NATURAL_VARIATION.generateTxnNote();

    paymentSessions.set(sessionId, {
      amount: NATURAL_VARIATION.getVariedAmount(req.body.amount),
      originalAmount: parseFloat(req.body.amount),
      orderId: req.body.orderId,
      customerRef,
      txnNote,
      status: 'pending',
      created: Date.now(),
      attempts: 0,
      config: {
        payeeVpa: config.payeeVpa,
        payeeName: config.payeeName,
        mcc: config.mcc,
        merchantCategory: config.merchantCategory
      },
      ip
    });

    // Update rate limit
    if (!IP_RATE_LIMIT.has(rateLimitKey)) {
      IP_RATE_LIMIT.set(rateLimitKey, { count: 1, timestamp: Date.now() });
    } else {
      IP_RATE_LIMIT.get(rateLimitKey).count++;
    }

    res.json({
      sessionId,
      amount: paymentSessions.get(sessionId).amount,
      payeeVpa: config.payeeVpa,
      payeeName: config.payeeName,
      customerRef,
      txnNote
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Payment initiation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);

    if (!session) return res.status(404).json({ error: 'Invalid or expired session' });

    // More realistic payment processing simulation
    session.attempts++;
    
    // Success probability increases with attempts but never guaranteed
    const successProbability = Math.min(0.3 + (session.attempts * 0.15), 0.9);
    
    if (Math.random() < successProbability) {
      session.status = 'success';
      session.utr = `UTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
      session.timestamp = new Date();
      
      // Store in transaction history
      transactionHistory.set(sessionId, {
        ...session,
        settledAt: new Date()
      });
    }

    res.json({
      status: session.status,
      utr: session.utr,
      amount: session.amount,
      timestamp: session.timestamp,
      payeeVpa: session.config.payeeVpa,
      payeeName: session.config.payeeName,
      customerRef: session.customerRef,
      txnNote: session.txnNote
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed: ' + error.message });
  }
};