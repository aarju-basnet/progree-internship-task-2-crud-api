const crypto = require('crypto');


const requireApiKey = (req, res, next) => {
  const expected = process.env.API_KEY;
  if (!expected) {
    return res.status(500).json({ error: 'Server misconfigured: API_KEY not set' });
  }
  const provided = req.get('x-api-key') || '';
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }
  next();
};

module.exports = { requireApiKey };
