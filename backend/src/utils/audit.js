const db = require('./firestore');
const admin = require('../config/firebase-admin');

const logAction = async (adminId, action, target, details = {}) => {
  await db.collection('auditLogs').add({
    adminId,
    action,
    target,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
};

module.exports = logAction;