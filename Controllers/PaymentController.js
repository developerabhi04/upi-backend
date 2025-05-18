// controllers/paymentController.js
import PaymentConfig from '../Model/PaymentModel.js';


export const setVpaConfig = async (req, res) => {
  try {
    const { payeeVpa, payeeName } = req.body;
    if (!payeeVpa || !payeeName) {
      return res.status(400).json({ error: 'VPA and Name required' });
    }

    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { payeeVpa, payeeName },
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
