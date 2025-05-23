import PaymentConfig from '../Model/PaymentModel.js';
import { v4 as uuidv4 } from 'uuid';


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


const NATURAL_VARIATION = {
  getVariedAmount: (amount) => {
    const base = parseFloat(amount);
    const variation = Math.min(base * 0.03, 15); // Max 3% or ₹15 variation
    const varied = base + (Math.random() * variation * 2 - variation);
    return Math.max(1, Math.min(2000, Number(varied.toFixed(2))))
  },
  randomDelay: () => 1000 + Math.random() * 4000, // 1-5 second delay
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
    // Debugging: Log incoming request
    console.log('Incoming request:', req.body);
    
    const ip = req.headers['x-forwarded-for'] || req.ip;
    console.log(`Request from IP: ${ip}`);

    // Validate input
    if (!req.body.amount || !req.body.orderId) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount and orderId' 
      });
    }

    // Get merchant config with error logging
    const config = await PaymentConfig.findOne().lean();
    console.log('Merchant config:', config);
    
    if (!config) {
      console.error('Merchant configuration missing');
      return res.status(400).json({ error: 'Merchant not configured' });
    }

    // Validate VPA format
    if (!/^\d{10}@idfcbank$/.test(config.payeeVpa)) {
      console.error('Invalid VPA format in config:', config.payeeVpa);
      return res.status(500).json({ error: 'Invalid merchant configuration' });
    }

    // Create session with enhanced logging
    const sessionId = `sess_${Date.now()}_${uuidv4().slice(0, 8)}`;
    console.log('Creating session:', sessionId);

    paymentSessions.set(sessionId, {
      amount: NATURAL_VARIATION.getVariedAmount(req.body.amount),
      originalAmount: parseFloat(req.body.amount),
      orderId: req.body.orderId,
      status: 'pending',
      created: Date.now(),
      config: {
        payeeVpa: config.payeeVpa,
        payeeName: config.payeeName,
        mcc: config.mcc
      },
      ip
    });

    res.json({
      sessionId,
      amount: paymentSessions.get(sessionId).amount,
      payeeVpa: config.payeeVpa,
      payeeName: config.payeeName
    });

  } catch (err) {
    console.error('❗ Initiation Error:', err.stack); // Log full error stack
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

    // Simulate payment processing
    session.attempts++;
    if (session.attempts >= 3 || Math.random() > 0.7) {
      session.status = 'success';
      session.utr = `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;
      session.timestamp = new Date();
    }

    res.json({
      status: session.status,
      utr: session.utr,
      amount: session.amount,
      timestamp: session.timestamp,
      payeeVpa: session.config.payeeVpa,
      payeeName: session.config.payeeName
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed: ' + error.message });
  }
};