const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Use dynamic import for node-fetch ESM package
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

// Use your actual keys here or via environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || '6LeN77grAAAAAIpV8VeQELxJz_7oNuWGVkjgGRsl';

// Global middleware
app.use(cors());
app.use(express.json());

// In-memory simulation of DB - replace with a real DB in production
const users = [
  { id: '1', email: 'admin@finq.com', passwordHash: bcrypt.hashSync('finq123', 10), verified: true },
];

const familyMembers = [
  { userId: '1', familyId: 'fam1', role: 'admin' },
];

// Health check endpoint
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

// Verify Google reCAPTCHA token helper
async function verifyRecaptcha(token) {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
    { method: 'POST' }
  );
  const data = await response.json();
  return data.success;
}

// Login API
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return res.status(400).json({ message: 'Captcha validation failed' });

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const hasFamily = familyMembers.some(m => m.userId === user.id);

  res.json({
    user: { id: user.id, email: user.email },
    accessToken: token,
    hasFamily,
  });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
