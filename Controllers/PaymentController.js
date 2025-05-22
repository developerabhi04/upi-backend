import PaymentConfig from '../Model/PaymentModel.js';



const paymentSessions = new Map();

// Session cleanup every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of paymentSessions) {
    if (now - session.created > 900000) {
      paymentSessions.delete(sessionId);
    }
  }
}, 900000);

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
    const { amount, orderId } = req.body;
    
    // Validate amount
    if (amount > 2000 || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be between ₹1 and ₹2000' });
    }

    // Verify merchant configuration
    const config = await PaymentConfig.findOne({});
    if (!config) {
      return res.status(400).json({ error: 'Merchant account not configured' });
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    paymentSessions.set(sessionId, {
      amount: parseFloat(amount),
      orderId,
      status: 'pending',
      created: Date.now(),
      attempts: 0,
      config: config // Store config with session
    });

    res.json({ 
      sessionId,
      payeeVpa: config.payeeVpa,
      payeeName: config.payeeName
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed: ' + error.message });
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