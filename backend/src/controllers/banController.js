const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');
const logAction = require('../utils/audit');

exports.banUser = async (req, res) => {
  const { userId, type, reason, duration } = req.body;
  if (!userId || !type || !reason) return res.status(400).json({ error: 'Missing fields' });
  const durations = { '1day': 86400000, '7days': 604800000, '30days': 2592000000 };
  const endTime = type !== 'permanent' ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + (durations[duration] || 86400000))) : null;
  const existing = await db.collection('bans').where('userId', '==', userId).where('active', '==', true).get();
  if (!existing.empty) return res.status(400).json({ error: 'Already banned' });
  const ref = await db.collection('bans').add({
    userId, bannedBy: req.user.uid, type, reason,
    startTime: admin.firestore.FieldValue.serverTimestamp(),
    endTime, active: true, appeal: null,
  });
  logAction(req.user.uid, 'ban_user', userId, { type, reason, banId: ref.id });
  res.status(201).json({ banId: ref.id });
};

exports.unbanUser = async (req, res) => {
  const ref = db.collection('bans').doc(req.params.banId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  await ref.update({ active: false, unbannedBy: req.user.uid });
  logAction(req.user.uid, 'unban_user', doc.data().userId, { banId: req.params.banId });
  res.json({ success: true });
};

exports.getBans = async (req, res) => {
  const snap = await db.collection('bans').where('active', '==', true).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

exports.appealBan = async (req, res) => {
  const ref = db.collection('bans').doc(req.params.banId);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404);
  await ref.update({ 'appeal': { message: req.body.message, status: 'pending' } });
  res.json({ success: true });
};

exports.resolveAppeal = async (req, res) => {
  const { status } = req.body;
  const ref = db.collection('bans').doc(req.params.banId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  await ref.update({ 'appeal.status': status, 'appeal.reviewedBy': req.user.uid });
  if (status === 'approved') await ref.update({ active: false });
  logAction(req.user.uid, status === 'approved' ? 'approve_appeal' : 'reject_appeal', doc.data().userId);
  res.json({ success: true });
};

exports.getAppeals = async (req, res) => {
  const snap = await db.collection('bans').where('appeal.status', '==', 'pending').get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};