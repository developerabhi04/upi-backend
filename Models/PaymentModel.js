import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["UPI-PhonePe", "UPI-Paytm"],
    required: true,
  },
  payeeVpa: {
    type: String,
    required: true,
  },
  payeeName: {
    type: String,
    required: true,
  },
});

export default mongoose.model("PaymentConfig", paymentConfigSchema);
