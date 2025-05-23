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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Enhanced IP rate limiting
    const ipEntry = IP_RATE_LIMIT.get(ip) || { count: 0, timestamp: Date.now() };
    if (ipEntry.count >= 10) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }

    // Validate request body
    const { amount, orderId } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate merchant configuration
    const config = await PaymentConfig.findOne();
    if (!config) {
      return res.status(400).json({ error: 'Merchant not configured' });
    }

    // Validate VPA format
    if (!config.payeeVpa.match(/^\d{10}@idfcbank$/)) {
      return res.status(400).json({ error: 'Invalid merchant VPA configuration' });
    }

    // Create payment session with proper UUID
    const sessionId = `sess_${Date.now()}_${uuidv4().slice(0, 8)}`; // Fixed UUID usage
    const safeAmount = NATURAL_VARIATION.getVariedAmount(amount);

    paymentSessions.set(sessionId, {
      amount: safeAmount,
      originalAmount: parseFloat(amount),
      orderId: `${orderId}_${uuidv4().slice(0, 8)}`, // Fixed UUID usage
      status: 'pending',
      created: Date.now(),
      config: {
        payeeVpa: config.payeeVpa,
        payeeName: config.payeeName,
        mcc: config.mcc,
        isIDFC: true // Force IDFC validation
      },
      attempts: 0,
      ip
    });

    // Update rate limits
    IP_RATE_LIMIT.set(ip, { 
      count: ipEntry.count + 1, 
      timestamp: Date.now() 
    });

    res.json({
      sessionId,
      amount: safeAmount,
      originalAmount: parseFloat(amount),
      orderId,
      payeeVpa: config.payeeVpa,
      payeeName: config.payeeName
    });

  } catch (error) {
    console.error('Initiation Error:', error); // Add logging
    res.status(500).json({ 
      error: 'Payment initiation failed',
      details: error.message
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