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
  })
);


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});


// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});


import paymentRoutes from './Routes/PaymentRoute.js';



app.use('/api/v1/payment', paymentRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
