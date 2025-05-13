import dotenv from "dotenv";
import PaymentConfig from "../Models/PaymentModel.js";
import { connectDB } from "./database.js";
// Load .env (so MONGO_URL is available)
dotenv.config({ path: "./.env" });

const configs = [
  {
    method: "UPI-PhonePe",
    payeeVpa: "your-phonepe-vpa@upi",
    payeeName: "YourMerchantName",
  },
  {
    method: "UPI-Paytm",
    payeeVpa: "your-paytm-vpa@paytm",
    payeeName: "YourMerchantName",
  },
];

async function seed() {
  try {
    // connectDB prints “DB Connected…” on success
    await connectDB(process.env.MONGO_URL);

    // wipe old configs (optional)
    await PaymentConfig.deleteMany({});
    await PaymentConfig.insertMany(configs);

    console.log("✅ PaymentConfig collection seeded.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  }
}

seed();
