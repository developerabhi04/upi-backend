// routes/paymentRoutes.js
import express from 'express';
import { checkPaymentStatus, getPaymentConfig, initiatePayment, setPaymentConfig } from '../Controllers/PaymentController.js';
import { paymentLimiter } from '../Middleware/AntiFraud.js';

const router = express.Router();


// Merchant Configuration
router.get('/config', getPaymentConfig);
router.post('/config', setPaymentConfig);
// router.post('/initiate', initiatePayment);
router.get('/status/:sessionId', checkPaymentStatus);
router.post('/initiate', 
  paymentLimiter,
  initiatePayment
);


export default router;
