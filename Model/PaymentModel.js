import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  payeeVpa: {
    type: String,
    required: true,
    match: [/^\d{10}@idfcbank$/, 'Invalid IDFC Bank VPA format']
  },
  payeeName: {
    type: String,
    required: true,
    maxlength: 50
  },
  mcc: {
    type: String,
    required: true,
    enum: ['6012', '6051', '6211']
  },
  gstin: {
    type: String,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('PaymentConfig', paymentConfigSchema);