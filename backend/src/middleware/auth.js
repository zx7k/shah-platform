const admin = require('../config/firebase-admin');
const db = require('../utils/firestore');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: userDoc.exists ? (userDoc.data().role || 'user') : 'user',
    };
    
    // Check for full/permanent bans
    const activeBans = await db.collection('bans')
      .where('userId', '==', decoded.uid)
      .where('active', '==', true)
      .where('type', 'in', ['full', 'permanent'])
      .get();
    if (!activeBans.empty) {
      return res.status(403).json({ error: 'Account banned', banId: activeBans.docs[0].id });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const requireModerator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'Moderator access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireModerator };