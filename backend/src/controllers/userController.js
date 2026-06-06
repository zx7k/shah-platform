const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');
const generateJGID = require('../utils/jgIdGenerator');

exports.getProfile = async (req, res) => {
  const doc = await db.collection('users').doc(req.user.uid).get();
  if (!doc.exists) {
    const jgId = await generateJGID();
    const defaultProfile = {
      uid: req.user.uid,
      jgId,
      name: req.user.email.split('@')[0] || '',
      email: req.user.email,
      avatar: '',
      status: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('users').doc(req.user.uid).set(defaultProfile);
    return res.json(defaultProfile);
  }
  res.json(doc.data());
};

exports.updateProfile = async (req, res) => {
  const { name, status, avatar } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (status !== undefined) updateData.status = status;
  if (avatar) updateData.avatar = avatar;
  await db.collection('users').doc(req.user.uid).update(updateData);
  const updated = await db.collection('users').doc(req.user.uid).get();
  res.json(updated.data());
};

exports.uploadPublicKey = async (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: 'Missing publicKey' });
  await db.collection('users').doc(req.user.uid).update({ publicKey });
  res.json({ success: true });
};

exports.getUserByJgId = async (req, res) => {
  const jgId = req.params.jgId.toUpperCase();
  const snap = await db.collection('users').where('jgId', '==', jgId).limit(1).get();
  if (snap.empty) return res.status(404).json({ error: 'Not found' });
  const doc = snap.docs[0];
  res.json({ uid: doc.id, ...doc.data() });
};