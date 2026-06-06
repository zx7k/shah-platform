const db = require('../utils/firestore');

exports.setKeys = async (req, res) => {
  const groupId = req.params.groupId;
  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists) return res.status(404);
  if (groupDoc.data().createdBy !== req.user.uid) return res.status(403);
  const { keys } = req.body;
  const batch = db.batch();
  for (const [uid, value] of Object.entries(keys)) {
    batch.set(groupRef.collection('groupKeys').doc(uid), value);
  }
  await batch.commit();
  res.json({ success: true });
};

exports.getKey = async (req, res) => {
  const { groupId, uid } = req.params;
  if (req.user.uid !== uid) return res.status(403);
  const keyDoc = await db.collection('groups').doc(groupId).collection('groupKeys').doc(uid).get();
  if (!keyDoc.exists) return res.status(404);
  res.json(keyDoc.data());
};