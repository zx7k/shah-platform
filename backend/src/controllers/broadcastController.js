const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');

exports.createBroadcast = async (req, res) => {
  const { name, description, avatar, postPermission } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const ref = await db.collection('broadcasts').add({
    name, description: description || '', avatar: avatar || '',
    createdBy: req.user.uid,
    isOfficial: false,
    postPermission: postPermission || 'admin',
    members: [req.user.uid],
    inviteCodes: [],
    pinnedMessages: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.status(201).json({ channelId: ref.id });
};

exports.getBroadcast = async (req, res) => {
  const doc = await db.collection('broadcasts').doc(req.params.channelId).get();
  if (!doc.exists) return res.status(404);
  res.json({ id: doc.id, ...doc.data() });
};

exports.listBroadcasts = async (req, res) => {
  const official = await db.collection('broadcasts').where('isOfficial', '==', true).get();
  const followed = await db.collection('broadcasts').where('members', 'array-contains', req.user.uid).get();
  const result = [...official.docs, ...followed.docs.filter(d => !official.docs.some(o => o.id === d.id))];
  res.json(result.map(d => ({ id: d.id, ...d.data() })));
};

exports.followChannel = async (req, res) => {
  const ref = db.collection('broadcasts').doc(req.params.channelId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  if (doc.data().members.includes(req.user.uid)) return res.status(400);
  await ref.update({ members: admin.firestore.FieldValue.arrayUnion(req.user.uid) });
  res.json({ message: 'Following' });
};

exports.unfollowChannel = async (req, res) => {
  const ref = db.collection('broadcasts').doc(req.params.channelId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  await ref.update({ members: admin.firestore.FieldValue.arrayRemove(req.user.uid) });
  res.json({ message: 'Unfollowed' });
};

exports.generateInviteCode = async (req, res) => {
  const ref = db.collection('broadcasts').doc(req.params.channelId);
  const doc = await ref.get();
  if (!doc.exists || doc.data().createdBy !== req.user.uid) return res.status(403);
  const { maxUses = 0, expiresInHours = 24 } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const invite = { code, maxUses, uses: 0, expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + expiresInHours * 3600000)) };
  await ref.update({ inviteCodes: admin.firestore.FieldValue.arrayUnion(invite) });
  res.json({ code });
};

exports.joinByCode = async (req, res) => {
  const { code } = req.body;
  const snap = await db.collection('broadcasts').where('inviteCodes', 'array-contains', { code }).get();
  if (snap.empty) return res.status(404);
  const doc = snap.docs[0];
  const data = doc.data();
  const invite = data.inviteCodes.find(c => c.code === code);
  if (!invite || invite.expiresAt.toDate() < new Date() || (invite.maxUses > 0 && invite.uses >= invite.maxUses)) {
    return res.status(400).json({ error: 'Code expired or used' });
  }
  await doc.ref.update({
    members: admin.firestore.FieldValue.arrayUnion(req.user.uid),
    inviteCodes: data.inviteCodes.map(c => c.code === code ? { ...c, uses: c.uses + 1 } : c),
  });
  res.json({ channelId: doc.id });
};

exports.postMessage = async (req, res) => {
  const ref = db.collection('broadcasts').doc(req.params.channelId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404);
  const data = doc.data();
  const canPost = data.postPermission === 'members' || (data.postPermission === 'admin' && data.createdBy === req.user.uid);
  if (!canPost) return res.status(403);
  const msgRef = await ref.collection('messages').add({
    sender: req.user.uid,
    text: req.body.text,
    pinned: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.json({ id: msgRef.id });
};

exports.getMessages = async (req, res) => {
  const snap = await db.collection('broadcasts').doc(req.params.channelId).collection('messages')
    .orderBy('createdAt', 'desc').limit(50).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
};

exports.togglePin = async (req, res) => {
  const channelRef = db.collection('broadcasts').doc(req.params.channelId);
  const channelDoc = await channelRef.get();
  if (!channelDoc.exists || channelDoc.data().createdBy !== req.user.uid) return res.status(403);
  const msgRef = channelRef.collection('messages').doc(req.params.msgId);
  const msgDoc = await msgRef.get();
  if (!msgDoc.exists) return res.status(404);
  const isPinned = msgDoc.data().pinned || false;
  await msgRef.update({ pinned: !isPinned });
  const pinnedMessages = channelDoc.data().pinnedMessages || [];
  if (!isPinned) {
    await channelRef.update({ pinnedMessages: [...pinnedMessages, req.params.msgId] });
  } else {
    await channelRef.update({ pinnedMessages: pinnedMessages.filter(id => id !== req.params.msgId) });
  }
  res.json({ pinned: !isPinned });
};