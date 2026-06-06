const admin = require('../config/firebase-admin');
const { sendVerificationCode } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

// Temporary in‑memory store for verification codes
const verificationCodes = new Map();   // email → { code, expiresAt }

exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  // Password strength validation
  if (!password || !password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with at least one letter and one number' });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || '',
    });

    // Generate 6‑digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,   // 10 minutes
    });

    // Send code via EmailJS
    await sendVerificationCode(email, code);

    res.status(201).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const stored = verificationCodes.get(email);

  if (!stored || stored.code !== code || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired verification code' });
  }

  verificationCodes.delete(email);

  // Mark email as verified in Firebase
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { emailVerified: true });

  res.json({ message: 'Email verified successfully' });
};

exports.login = async (req, res) => {
  const { idToken } = req.body;   // Firebase ID token received from client

  if (!idToken) {
    return res.status(400).json({ error: 'Firebase ID token is required' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Check email verification
    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord.emailVerified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    // Generate our own tokens
    const role = userRecord.customClaims?.role || 'user';
    const accessToken = generateAccessToken(uid, role);
    const refreshToken = generateRefreshToken();

    // Store refresh token in Firestore (or Redis in production)
    await admin.firestore().collection('refreshTokens').doc(refreshToken).set({
      uid,
      role,
      createdAt: new Date(),
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
    });

    res.json({
      accessToken,
      user: {
        uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const tokenDoc = await admin.firestore().collection('refreshTokens').doc(refreshToken).get();

    if (!tokenDoc.exists) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const { uid, role } = tokenDoc.data();
    const newAccessToken = generateAccessToken(uid, role);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      await admin.firestore().collection('refreshTokens').doc(refreshToken).delete();
    } catch (error) {
      console.error('Logout token deletion error:', error);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};
