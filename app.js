import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database/database.js';
import PaymentRoute from './Routes/PaymentRoute.js';

dotenv.config({ path: './database/.env' });

const app = express();
const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGO_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET','POST','OPTIONS'],
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.header('Content-Security-Policy', "default-src 'self' https:;");
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  next();
});

app.use('/api/v1/payment', PaymentRoute);

app.get('/', (req, res) => res.json({ status: 'active', version: '1.0.0' }));

// Error handler (catches thrown errors too)
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
