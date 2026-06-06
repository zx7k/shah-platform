const admin = require('../config/firebase-admin');
const { sendVerificationCode } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const verificationCodes = new Map(); // In production use Redis

exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)) {
    return res.status(400).json({ error: 'Password must be at least 8 chars with letter and number' });
  }
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    await sendVerificationCode(email, code);
    res.status(201).json({ message: 'Verification code sent' });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const stored = verificationCodes.get(email);
  if (!stored || stored.code !== code || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }
  verificationCodes.delete(email);
  await admin.auth().updateUser(
    (await admin.auth().getUserByEmail(email)).uid,
    { emailVerified: true }
  );
  res.json({ message: 'Email verified' });
};

exports.login = async (req, res) => {
  const { idToken } = req.body; // received from client Firebase sign-in
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userRecord = await admin.auth().getUser(decoded.uid);
    if (!userRecord.emailVerified) return res.status(403).json({ error: 'Email not verified' });
    const role = userRecord.customClaims?.role || 'user';
    const accessToken = generateAccessToken(decoded.uid, role);
    const refreshToken = generateRefreshToken();
    // Store refresh token (in Firestore or Redis)
    await admin.firestore().collection('refreshTokens').doc(refreshToken).set({
      uid: decoded.uid, role, createdAt: new Date()
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken, user: { uid: decoded.uid, email: userRecord.email, name: userRecord.displayName } });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
  const tokenDoc = await admin.firestore().collection('refreshTokens').doc(refreshToken).get();
  if (!tokenDoc.exists) return res.status(401).json({ error: 'Invalid refresh token' });
  const { uid, role } = tokenDoc.data();
  const accessToken = generateAccessToken(uid, role);
  res.json({ accessToken });
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await admin.firestore().collection('refreshTokens').doc(refreshToken).delete();
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};