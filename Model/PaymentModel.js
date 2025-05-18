import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  payeeVpa: {
    type: String,
    required: true,
    match: [/^[\w.-]+@[\w-]+$/, 'Invalid VPA format (e.g., username@bank)']
  },
  payeeName: {
    type: String,
    required: true,
    maxlength: 50
  }
}, { timestamps: true });

export default mongoose.model('PaymentConfig', paymentConfigSchema);
 