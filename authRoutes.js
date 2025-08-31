const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || 'your_recaptcha_secret_here';

// Simulated users - replace with real DB queries
const users = [
  {
    id: '1',
    email: 'admin@finq.com',
    passwordHash: bcrypt.hashSync('finq123', 10),
    verified: true,
  },
];

// Simulated family membership data
const familyMembers = [
  { userId: '1', familyId: 'family1', role: 'admin' },
];

// Verify Google reCAPTCHA token helper
async function verifyRecaptcha(token) {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
    { method: 'POST' }
  );
  const data = await response.json();
  return data.success;
}

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password || !recaptchaToken) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const captchaValid = await verifyRecaptcha(recaptchaToken);
    if (!captchaValid) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Email is not verified.' });
    }

    const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const hasFamily = familyMembers.some(fm => fm.userId === user.id);

    return res.json({
      user: { id: user.id, email: user.email },
      accessToken,
      hasFamily,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
