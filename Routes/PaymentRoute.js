// routes/paymentRoutes.js
import express from 'express';
import { paymentStatus, verifyConfig } from '../Controllers/PaymentController.js';

const router = express.Router();


router.get('/verify-config', verifyConfig);
router.get('/status/:orderId', paymentStatus);

export default router;
