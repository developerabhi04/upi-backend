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

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'none';" +
    "connect-src 'self' https://upi-backend-4.onrender.com;" +
    "script-src 'self';" +
    "style-src 'self' 'unsafe-inline';" +
    "img-src 'self' data:;" +
    "font-src 'self';" +
    "frame-src upi://* phonepe://* paytmmp://*;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000');
  next();
});



// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Payment processing failed',
    code: 'UPI_ERR_500'
  });
});



import paymentRoutes from './Routes/PaymentRoute.js';



app.use('/api/v1/payment', paymentRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
