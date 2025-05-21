// models/PaymentConfig.js
import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema({
  payeeVpa: {
    type: String,
    required: true,
    // Server-side validation (relaxed for more banks)
    match: [/^[A-Za-z0-9_.-]+@[A-Za-z0-9]+$/, 'Invalid VPA format (e.g., mystore@ybl)']
  },
  payeeName: {
    type: String,
    required: true,
    maxlength: 50
  },
  isMerchantAccount: {
    type: Boolean,
    required: true,
    default: false
  },
  mcc: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Invalid MCC code']
  }
}, { timestamps: true });

export default mongoose.model("PaymentConfig", paymentConfigSchema);
