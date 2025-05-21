// controllers/paymentController.js
import PaymentConfig from '../Model/PaymentModel.js';

export const setVpaConfig = async (req, res) => {
  try {
    const { payeeVpa, payeeName, isMerchantAccount, mcc } = req.body;
    if (!payeeVpa || !payeeName || !mcc) {
      return res.status(400).json({ error: 'VPA, Name, and MCC required' });
    }
    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { payeeVpa, payeeName, isMerchantAccount, mcc },
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
    if (!config) {
      return res.status(404).json({ error: 'VPA not configured' });
    }
    res.status(200).json(config);
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
  const { orderId } = req.params;
  // Implement actual bank API check here
  res.status(200).json({ status: 'pending' });
};
