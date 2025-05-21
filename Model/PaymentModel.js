// models/PaymentConfig.js
import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema({
  payeeVpa: {
    type: String,
    required: true,
    validate: {
      validator: v => /^[\w.-]+@(ok\w+|ybl|axl|ibl|sbi)$/i.test(v),
      message: 'Invalid merchant VPA format (e.g., business@ybl)'
    }
  },
  payeeName: {
    type: String,
    required: true,
    match: [/^[A-Za-z0-9 ]{3,}$/, 'Name must be alphanumeric']
  },
  isMerchantAccount: {
    type: Boolean,
    required: true,
    default: false
  },
  mcc: { // Merchant Category Code (Get from bank)
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Invalid MCC code']
  }
}, { timestamps: true });

export default mongoose.model("PaymentConfig", paymentConfigSchema);
