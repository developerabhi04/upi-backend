// routes/paymentRoutes.js
import express from 'express';
import { checkPaymentStatus, getPaymentConfig, initiatePayment, setPaymentConfig } from '../Controllers/PaymentController.js';
import { requestSanitizer } from '../Middleware/AntiFraud.js';

const router = express.Router();


router.get('/config', getPaymentConfig);
router.post('/config', setPaymentConfig);

router.post(
  '/initiate',
  requestSanitizer,
  initiatePayment
);

router.get('/status/:sessionId', checkPaymentStatus);

export default router;
