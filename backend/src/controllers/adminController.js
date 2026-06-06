const db = require('../utils/firestore');

exports.getDashboardStats = async (req, res) => {
  const [users, groups, msgs, reports, bans] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('groups').count().get(),
    db.collectionGroup('messages').count().get(),
    db.collection('reports').where('status', '==', 'pending').count().get(),
    db.collection('bans').where('active', '==', true).count().get(),
  ]);
  res.json({
    totalUsers: users.data().count,
    totalGroups: groups.data().count,
    totalMessages: msgs.data().count,
    pendingReports: reports.data().count,
    activeBans: bans.data().count,
  });
};

exports.getAuditLogs = async (req, res) => {
  const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};