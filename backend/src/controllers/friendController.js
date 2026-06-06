const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');

exports.sendRequest = async (req, res) => {
  const fromUid = req.user.uid;
  const { jgId } = req.body;
  const targetSnap = await db.collection('users').where('jgId', '==', jgId.toUpperCase()).limit(1).get();
  if (targetSnap.empty) return res.status(404).json({ error: 'User not found' });
  const toUid = targetSnap.docs[0].id;
  if (toUid === fromUid) return res.status(400).json({ error: 'Cannot request yourself' });
  
  // Check existing friendship
  const friendsSnap = await db.collection('friends')
    .where('participants', 'array-contains', fromUid).get();
  const already = friendsSnap.docs.find(doc => doc.data().participants.includes(toUid) && doc.data().status === 'accepted');
  if (already) return res.status(400).json({ error: 'Already friends' });
  
  // Check pending request
  const existing = await db.collection('friendRequests')
    .where('from', '==', fromUid).where('to', '==', toUid).where('status', '==', 'pending').get();
  if (!existing.empty) return res.status(400).json({ error: 'Request already sent' });
  
  await db.collection('friendRequests').add({
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.json({ message: 'Friend request sent' });
};

exports.respondToRequest = async (req, res) => {
  const uid = req.user.uid;
  const { requestId, action } = req.body;
  const doc = await db.collection('friendRequests').doc(requestId).get();
  if (!doc.exists || doc.data().to !== uid) return res.status(404).json({ error: 'Not found' });
  if (action === 'accept') {
    const chatRef = await db.collection('chats').add({
      type: 'private',
      participants: [doc.data().from, uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('friends').add({
      participants: [doc.data().from, uid],
      chatId: chatRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('friendRequests').doc(requestId).update({ status: 'accepted' });
    res.json({ chatId: chatRef.id });
  } else {
    await db.collection('friendRequests').doc(requestId).update({ status: 'declined' });
    res.json({ message: 'Declined' });
  }
};

exports.getRequests = async (req, res) => {
  const uid = req.user.uid;
  const sent = await db.collection('friendRequests').where('from', '==', uid).where('status', '==', 'pending').get();
  const received = await db.collection('friendRequests').where('to', '==', uid).where('status', '==', 'pending').get();
  res.json({
    sent: sent.docs.map(d => ({ id: d.id, ...d.data() })),
    received: received.docs.map(d => ({ id: d.id, ...d.data() })),
  });
};