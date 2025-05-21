// controllers/paymentController.js
import PaymentConfig from '../Model/PaymentModel.js';



export const verifyConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne({});
    const valid = config?.isMerchantAccount && config?.mcc?.length === 4;
    res.status(200).json({ valid });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
};

// Add to existing controller
export const paymentStatus = async (req, res) => {
  const { orderId } = req.params;
  // Implement actual bank API check here
  res.status(200).json({ status: 'pending' });
};
