const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');
const logAction = require('../utils/audit');

exports.submitReport = async (req, res) => {
  const { targetUid, targetMsgId, targetType, category, description } = req.body;
  const report = {
    reportedBy: req.user.uid,
    targetUid: targetUid || null,
    targetMsgId: targetMsgId || null,
    targetType,
    category,
    description: description || '',
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await db.collection('reports').add(report);
  res.status(201).json({ reportId: ref.id });
};

exports.getReports = async (req, res) => {
  const snap = await db.collection('reports').where('status', '==', 'pending').orderBy('createdAt', 'asc').get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

exports.resolveReport = async (req, res) => {
  const { action, reason } = req.body;
  const ref = db.collection('reports').doc(req.params.reportId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  await ref.update({
    status: action === 'resolve' ? 'resolved' : 'dismissed',
    resolvedBy: req.user.uid,
    resolution: reason || '',
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  logAction(req.user.uid, action === 'resolve' ? 'resolve_report' : 'dismiss_report', req.params.reportId, { reason });
  res.json({ success: true });
};