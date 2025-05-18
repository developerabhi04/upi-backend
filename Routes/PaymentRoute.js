// routes/paymentRoutes.js
import express from 'express';
import { setVpaConfig, getVpaConfig } from '../Controllers/PaymentController.js';

const router = express.Router();


router.get('/config', getVpaConfig);
router.post('/config', setVpaConfig);

export default router;
