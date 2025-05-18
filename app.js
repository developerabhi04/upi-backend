import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import paymentRoutes from './Routes/PaymentRoute.js';

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect('mongodb://localhost:27017/upi-demo')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo error', err));

app.use('/api/v1/payment', paymentRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));
