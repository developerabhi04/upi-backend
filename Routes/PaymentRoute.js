// routes/paymentRoutes.js
import express from 'express';
import { checkPaymentStatus, getPaymentConfig, initiatePayment, setPaymentConfig } from '../Controllers/PaymentController.js';

const router = express.Router();


// Merchant Configuration
router.get('/config', getPaymentConfig);
router.post('/config', setPaymentConfig);
router.post('/initiate', initiatePayment);
router.get('/status/:sessionId', checkPaymentStatus);

export default router;
