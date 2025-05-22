import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { connectDB } from './database/database.js';

dotenv.config({
  path: "./database/.env",
});



const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB = process.env.MONGO_URL;

// Connect to MongoDB
connectDB(MONGODB);


app.use(express.json());


app.use(
  cors({
    origin: process.env.CLIENT_URL, // Default to localhost if CLIENT_URL is missing
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Transaction failed',
    code: 'UPI_BLOCKED',
    message: 'Ensure receiver account is merchant-enabled'
  });
});


app.use((req, res, next) => {
  res.setHeader('X-UPI-Validated', 'true');
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});


app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self';" +
    "connect-src 'self' http://localhost:4000 ws://localhost:4000;" +
    "script-src 'self' 'unsafe-inline';" +
    "style-src 'self' 'unsafe-inline';" +
    "img-src 'self' data:;" +
    "frame-src upi://* phonepe://* paytmmp://*;"
  );
  next();
});


import paymentRoutes from './Routes/PaymentRoute.js';



app.use('/api/v1/payment', paymentRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
