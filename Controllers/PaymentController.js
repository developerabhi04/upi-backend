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
    const { payeeVpa, payeeName, mcc, gstin } = req.body;
    
    if (!/^\d{10}@idfcbank$/.test(payeeVpa)) {
      return res.status(400).json({ error: 'Invalid IDFC Bank VPA' });
    }

    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { payeeVpa, payeeName, mcc, gstin },
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
    config ? res.json(config) : res.status(404).json({ error: 'No configuration found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    paymentSessions.set(sessionId, {
      amount: parseFloat(amount),
      orderId,
      status: 'pending',
      created: Date.now(),
      attempts: 0
    });

    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);

    if (!session) return res.status(404).json({ error: 'Invalid session' });

    // Mock status update
    session.attempts++;
    if (session.attempts >= 2 || Math.random() > 0.6) {
      session.status = 'success';
      session.utr = `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }

    res.json({
      status: session.status,
      utr: session.utr,
      amount: session.amount
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
};