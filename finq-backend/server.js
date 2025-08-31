require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  JWT_SECRET,
  RECAPTCHA_SECRET,
  EMAIL_FROM,
  FRONTEND_URL,
  EMAIL_SUBJECT_VERIFICATION,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = process.env;

const PORT = process.env.PORT || 8080;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// In-memory "database"
const users = [
  { id: '1', email: 'admin@finq.com', passwordHash: bcrypt.hashSync('finq123', 10), verified: true },
];

const familyMembers = [
  { userId: '1', familyId: 'fam1', role: 'admin' },
];

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'finq-secret-session', 
  resave: false, 
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/v1/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  try {
    let user = users.find(u => u.googleId === profile.id || u.email === profile.emails[0].value);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        googleId: profile.id,
        email: profile.emails[0].value,
        verified: true,
      };
      users.push(user);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user || null);
});

// Helper: verify Google reCAPTCHA token
async function verifyRecaptcha(token) {
  if (!token) return false;
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
    { method: 'POST' }
  );
  const data = await response.json();
  return data.success;
}

// Helper: generate email verification JWT token (expires in 1 day)
function generateEmailVerificationToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
}

// Helper: send verification email
async function sendVerificationEmail(email, token) {
  const verifyLink = `${FRONTEND_URL}/verify-email.html?token=${token}`;
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: EMAIL_SUBJECT_VERIFICATION || 'Verify your FINQ account',
    html: `
      <p>Hello,</p>
      <p>Thank you for signing up for FINQ. Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyLink}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not sign up, you can ignore this email.</p>
      <p>Best regards,<br/>FINQ Team</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// Health check route
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

// Signup API
app.post('/api/v1/auth/signup', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return res.status(400).json({ message: 'Captcha validation failed' });

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    verified: false,
  };
  users.push(newUser);

  const token = generateEmailVerificationToken(email);

  sendVerificationEmail(email, token).catch(console.error);

  return res.json({ message: 'Signup successful, verification email sent' });
});

// Email verification API
app.post('/api/v1/auth/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Verification token missing' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.verified) {
      return res.json({ message: 'Email already verified' });
    }

    user.verified = true;
    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification token expired' });
    }
    return res.status(400).json({ message: 'Invalid verification token' });
  }
});

// Resend verification email API
app.post('/api/v1/auth/resend-verification', async (req, res) => {
  const { email, recaptchaToken } = req.body;
  if (!email || !recaptchaToken) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return res.status(400).json({ message: 'Captcha validation failed' });

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.verified) {
    return res.status(400).json({ message: 'User already verified' });
  }

  const token = generateEmailVerificationToken(email);

  try {
    await sendVerificationEmail(email, token);
    return res.json({ message: 'Verification email resent' });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// Login API - only allow verified users
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return res.status(400).json({ message: 'Captcha validation failed' });

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  if (!user.verified) {
    return res.status(403).json({ message: 'Email not verified. Please verify your email first.' });
  }

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

// Google OAuth routes
app.get('/api/v1/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/v1/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard.html');
  });

// Serve static frontend files (adjust path as needed)
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Index.html'));
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
