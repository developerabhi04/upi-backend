import rateLimit from 'express-rate-limit';

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased to 10 attempts/hour
  keyGenerator: (req) => {
    // Use combined key of IP and fingerprint
    const fingerprint = crypto
      .createHash('md5')
      .update(req.headers['user-agent'] + req.ip)
      .digest('hex');
    return `${req.ip}_${fingerprint}`;
  },
  handler: (req, res) => res.status(429).json({
    error: 'Transaction limit exceeded. Try again later.'
  })
});