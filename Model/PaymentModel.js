import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema({
  payeeVpa: {
    type: String,
    required: true,
    match: [
      /^(?:\+?91)?[0-9]{10}@[a-zA-Z0-9]+$|^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z0-9]{2,}$/,
      'Invalid VPA format (e.g., 9599516256@idfcbank or mystore@ybl)'
    ]
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
  },
  gstin: {
    type: String,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN']
  }
}, { timestamps: true });

export default mongoose.model("PaymentConfig", paymentConfigSchema);