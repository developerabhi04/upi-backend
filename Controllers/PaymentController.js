import PaymentConfig from "../Models/PaymentModel.js";

export const getPaymentConfigs = async (req, res) => {
  try {
    const configs = await PaymentConfig.find({});
    return res.status(200).json({ success: true, configs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
