import PaymentConfig from '../Model/PaymentModel.js';


export const setVpaConfig = async (req, res) => {
  try {
    const { payeeVpa, payeeName, isMerchantAccount, mcc, gstin } = req.body;
    
    if (!payeeVpa || !payeeName || !mcc) {
      return res.status(400).json({ error: 'VPA, Name, and MCC required' });
    }

    const validMCC = ['6012', '6051', '6211']; // Add your valid MCC codes
    if (!validMCC.includes(mcc)) {
      return res.status(400).json({ error: 'Invalid MCC code for banking services' });
    }

    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { payeeVpa, payeeName, isMerchantAccount, mcc, gstin },
      { upsert: true, new: true }
    );
    
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVpaConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne({});
    config ? res.status(200).json(config) : res.status(404).json({ error: 'VPA not configured' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne({});
    const valid = config?.isMerchantAccount && config?.mcc?.length === 4;
    res.status(200).json({ valid });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
};

export const paymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Implement actual bank API integration here
    res.status(200).json({ 
      status: 'success',
      utr: `UTR${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
};
