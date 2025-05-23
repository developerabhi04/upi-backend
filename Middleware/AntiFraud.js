import rateLimit from 'express-rate-limit';

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Increased limit
  keyGenerator: (req) => {
    // More sophisticated fingerprinting
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const uaHash = crypto
      .createHash('sha256')
      .update(req.headers['user-agent'])
      .digest('hex')
      .slice(0, 8);
    return `${ip}_${uaHash}`;
  },
  handler: (req, res) => res.status(429).json({
    error: 'Transaction limit exceeded. Please try again later.'
  }),
  skip: (req) => {
    // Skip rate limiting for certain conditions
    return req.method === 'OPTIONS';
  }
});