const User = require('./models/User');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

// Environment variables with defaults
const {
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = '587',
  SMTP_USER = process.env.SMTP_USER,
  SMTP_PASS = process.env.SMTP_PASS,
  JWT_SECRET = 'finq-secret-key',
  RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET,
  EMAIL_FROM = '"FINQ App" <noreply@finq.com>',
  FRONTEND_URL = 'http://localhost:3000',
  EMAIL_SUBJECT_VERIFICATION = 'Please verify your FINQ account email',
  GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET,
} = process.env;

const PORT = process.env.PORT || 8080;

// Nodemailer transporter
let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_PORT == 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

// In-memory storage
const users = [
  {
    id: '1',
    email: 'admin@finq.com',
    passwordHash: bcrypt.hashSync('finq123', 10),
    verified: true,
    displayName: 'Admin',
    bio: 'FINQ Administrator',
    avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=admin',
    createdAt: new Date().toISOString(),
  },
];

const familyMembers = [
  { userId: '1', familyId: 'fam1', role: 'admin' },
];

const transactions = [];
const budgets = [{ userId: '1', budget: 50000 }];

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(session({
  secret: 'finq-secret-session',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Passport setup (only if Google OAuth is configured)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback",
  }, (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile.emails[0].value);
      let user = users.find(u => u.googleId === profile.id || u.email === profile.emails[0].value);
      if (!user) {
        user = {
          id: crypto.randomUUID(),
          googleId: profile.id,
          email: profile.emails[0].value,
          verified: true,
          displayName: profile.displayName || profile.emails[0].value.split('@')[0],
          bio: '',
          avatarUrl: profile.photos?.[0]?.value || `https://api.dicebear.com/6.x/avataaars/svg?seed=${encodeURIComponent(profile.emails[0].value)}`,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        console.log('New Google user created:', user.email);
      } else {
        console.log('Existing user found:', user.email);
      }
      done(null, user);
    } catch (err) { 
      console.error('Google OAuth error:', err);
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
}

// Helper functions
async function verifyRecaptcha(token) {
  if (!token || !RECAPTCHA_SECRET) return true; // Skip if not configured
  
  try {
    // Using node-fetch alternative with built-in fetch
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    return true; // Allow if verification fails
  }
}

function generateEmailVerificationToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
}

async function sendVerificationEmail(email, token) {
  if (!transporter) {
    console.log('Email transporter not configured, skipping email send');
    return Promise.resolve();
  }
  
  const verifyLink = `${FRONTEND_URL}/verify-email.html?token=${token}`;
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: EMAIL_SUBJECT_VERIFICATION,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to FINQ!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
        <p>Or copy this link: <a href="${verifyLink}">${verifyLink}</a></p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// JWT middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authorization token required' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = users.find(u => u.id === payload.sub);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: users.length,
    transactions: transactions.length,
    emailConfigured: !!transporter,
    googleOAuthConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
  });
});

// Signup
app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Verify reCAPTCHA if token provided
    if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }
    
    // Check if user exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      passwordHash,
      verified: !transporter, // Auto-verify if email service not configured
      displayName: email.split('@')[0],
      bio: '',
      avatarUrl: `https://api.dicebear.com/6.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);

    // Send verification email if configured
    if (transporter && !newUser.verified) {
      const token = generateEmailVerificationToken(email);
      try {
        await sendVerificationEmail(email, token);
        res.json({ message: 'Signup successful! Please check your email to verify your account.' });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        newUser.verified = true; // Auto-verify if email fails
        res.json({ 
          message: 'Signup successful! Email service unavailable, account auto-verified.',
          warning: 'Email service unavailable'
        });
      }
    } else {
      res.json({ message: 'Signup successful! Account is ready to use.' });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error during signup' });
  }
});

// Verify Email
app.post('/api/v1/auth/verify-email', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });
    
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) return res.json({ message: 'Email already verified' });
    
    user.verified = true;
    user.verifiedAt = new Date().toISOString();
    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(400).json({ message: 'Verification link has expired. Please signup again.' });
    } else {
      res.status(400).json({ message: 'Invalid verification token' });
    }
  }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Verify reCAPTCHA if token provided
    if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.verified) return res.status(403).json({ message: 'Please verify your email first' });
    
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    const hasFamily = familyMembers.some(fm => fm.userId === user.id);
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        displayName: user.displayName 
      }, 
      accessToken: token,
      hasFamily 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Profile routes
app.get('/api/v1/profile', authenticateJWT, (req, res) => {
  const { email, displayName, bio, avatarUrl, createdAt, lastLogin } = req.user;
  res.json({ email, displayName, bio, avatarUrl, createdAt, lastLogin });
});

app.put('/api/v1/profile', authenticateJWT, (req, res) => {
  const { displayName, bio } = req.body;
  if (!displayName || displayName.trim().length < 2) {
    return res.status(400).json({ message: 'Display name must be at least 2 characters' });
  }
  if (typeof bio !== 'string' || bio.length > 500) {
    return res.status(400).json({ message: 'Bio must be a string with max 500 characters' });
  }
  
  req.user.displayName = displayName.trim();
  req.user.bio = bio.trim();
  req.user.updatedAt = new Date().toISOString();
  res.json({ message: 'Profile updated successfully' });
});

// Transaction routes
app.get('/api/v1/transactions', authenticateJWT, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.id);
  res.json(userTransactions);
});

app.post('/api/v1/transactions', authenticateJWT, (req, res) => {
  const { amount, type, category, mode, notes } = req.body;
  if (!amount || !type || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount and type are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Type must be either income or expense' });
  }
  
  const transaction = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    amount: parseFloat(amount),
    type,
    category: category || 'others',
    mode: mode || 'cash',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };
  transactions.push(transaction);
  res.status(201).json(transaction);
});

app.put('/api/v1/transactions/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const transaction = transactions.find(t => t.id === id && t.userId === req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  
  const { amount, type, category, mode, notes } = req.body;
  if (amount && amount > 0) transaction.amount = parseFloat(amount);
  if (type && ['income', 'expense'].includes(type)) transaction.type = type;
  if (category) transaction.category = category;
  if (mode) transaction.mode = mode;
  if (notes !== undefined) transaction.notes = notes;
  transaction.updatedAt = new Date().toISOString();
  
  res.json(transaction);
});

app.delete('/api/v1/transactions/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const index = transactions.findIndex(t => t.id === id && t.userId === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'Transaction not found' });
  
  const deleted = transactions.splice(index, 1)[0];
  res.json({ message: 'Transaction deleted successfully', transaction: deleted });
});

// Budget routes
app.get('/api/v1/budget', authenticateJWT, (req, res) => {
  const userBudget = budgets.find(b => b.userId === req.user.id);
  res.json({ budget: userBudget?.budget || 25000 });
});

app.post('/api/v1/budget', authenticateJWT, (req, res) => {
  const { budget } = req.body;
  if (!budget || budget <= 0) {
    return res.status(400).json({ message: 'Budget must be a positive number' });
  }
  
  const existingBudget = budgets.find(b => b.userId === req.user.id);
  if (existingBudget) {
    existingBudget.budget = parseFloat(budget);
    existingBudget.updatedAt = new Date().toISOString();
  } else {
    budgets.push({ 
      userId: req.user.id, 
      budget: parseFloat(budget),
      createdAt: new Date().toISOString()
    });
  }
  res.json({ message: 'Budget updated successfully', budget: parseFloat(budget) });
});

// Google OAuth routes (only if configured)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  app.get('/api/v1/auth/google', (req, res, next) => {
    console.log('Initiating Google OAuth');
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/v1/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html?error=oauth_failed' }), 
    (req, res) => {
      try {
        console.log('Google OAuth callback successful for user:', req.user.email);
        const token = jwt.sign({ sub: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '24h' });
        req.user.lastLogin = new Date().toISOString();
        res.redirect(`/dashboard.html?token=${token}`);
      } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect('/login.html?error=oauth_failed');
      }
    }
  );
} else {
  // Fallback routes if OAuth not configured
  app.get('/api/v1/auth/google', (req, res) => {
    res.redirect('/login.html?error=oauth_not_configured');
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Specific routes for HTML files
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'signup.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'dashboard.html')));
app.get('/verify-email.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'verify-email.html')));

// Default route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FINQ API running on port ${PORT}`);
  console.log(`📧 Email service: ${transporter ? 'Configured' : 'Not configured'}`);
  console.log(`🔑 reCAPTCHA: ${RECAPTCHA_SECRET ? 'Configured' : 'Not configured'}`);
  console.log(`📱 Google OAuth: ${(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) ? 'Configured' : 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`👥 Users: ${users.length}`);
});
