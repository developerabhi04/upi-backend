import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { connectDB } from './database/database.js';
import PaymentRoute from './Routes/PaymentRoute.js';

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
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.use((req, res, next) => {
  res.header('Content-Security-Policy', "default-src 'self' https:;");
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  next();
});

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/payment', PaymentRoute);

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'active', version: '1.0.0' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
