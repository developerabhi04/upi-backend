// routes/paymentRoutes.js
import express from 'express';
import { getVpaConfig, paymentStatus, setVpaConfig, verifyConfig } from '../Controllers/PaymentController.js';

const router = express.Router();


router.get('/config', getVpaConfig);
router.post('/config', setVpaConfig);
router.get('/verify-config', verifyConfig);
router.get('/status/:orderId', paymentStatus);

export default router;
