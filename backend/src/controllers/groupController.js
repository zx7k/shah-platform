const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');

exports.createGroup = async (req, res) => {
  const uid = req.user.uid;
  const { name, description, avatar, memberJgIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  
  const members = [{ uid, role: 'admin', joinedAt: new Date() }];
  if (memberJgIds && memberJgIds.length > 0) {
    const usersSnap = await db.collection('users').where('jgId', 'in', memberJgIds.map(id => id.toUpperCase())).get();
    usersSnap.docs.forEach(doc => {
      if (doc.id !== uid) members.push({ uid: doc.id, role: 'member', joinedAt: new Date() });
    });
  }
  const groupRef = await db.collection('groups').add({
    name,
    description: description || '',
    avatar: avatar || '',
    createdBy: uid,
    members,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    pinnedMessages: [],
  });
  res.status(201).json({ groupId: groupRef.id, members });
};

exports.getGroup = async (req, res) => {
  const doc = await db.collection('groups').doc(req.params.groupId).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  const data = doc.data();
  if (!data.members.some(m => m.uid === req.user.uid)) return res.status(403).json({ error: 'Not a member' });
  res.json({ id: doc.id, ...data });
};

exports.listGroups = async (req, res) => {
  const snap = await db.collection('groups').where('members', 'array-contains', { uid: req.user.uid }).get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

exports.inviteToGroup = async (req, res) => {
  const groupId = req.params.groupId;
  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists) return res.status(404).json({ error: 'Group not found' });
  const group = groupDoc.data();
  const requester = group.members.find(m => m.uid === req.user.uid);
  if (!requester || (requester.role !== 'admin' && requester.role !== 'moderator')) return res.status(403).json({ error: 'Not allowed' });
  const jgIds = req.body.jgIds;
  const usersSnap = await db.collection('users').where('jgId', 'in', jgIds.map(id => id.toUpperCase())).get();
  const newMembers = [];
  usersSnap.docs.forEach(doc => {
    if (!group.members.some(m => m.uid === doc.id)) {
      newMembers.push({ uid: doc.id, role: 'member', joinedAt: new Date() });
    }
  });
  await groupRef.update({ members: admin.firestore.FieldValue.arrayUnion(...newMembers) });
  res.json({ message: 'Members invited', newMembers });
};

exports.updateMember = async (req, res) => {
  const { groupId, targetUid } = req.params;
  const { action, role, muteDuration } = req.body;
  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists) return res.status(404);
  const group = groupDoc.data();
  const requester = group.members.find(m => m.uid === req.user.uid);
  if (!requester) return res.status(403);
  const targetIndex = group.members.findIndex(m => m.uid === targetUid);
  if (targetIndex === -1) return res.status(404);
  
  if (action === 'remove') {
    group.members.splice(targetIndex, 1);
    await groupRef.update({ members: group.members });
  } else if (action === 'changeRole') {
    if (!['admin', 'moderator', 'member'].includes(role)) return res.status(400);
    group.members[targetIndex].role = role;
    await groupRef.update({ members: group.members });
  } else if (action === 'mute') {
    group.members[targetIndex].mutedUntil = muteDuration ? new Date(Date.now() + muteDuration) : null;
    await groupRef.update({ members: group.members });
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }
  res.json({ success: true });
};

exports.leaveGroup = async (req, res) => {
  const groupId = req.params.groupId;
  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists) return res.status(404);
  const group = groupDoc.data();
  const index = group.members.findIndex(m => m.uid === req.user.uid);
  if (index === -1) return res.status(400);
  group.members.splice(index, 1);
  if (!group.members.some(m => m.role === 'admin') && group.members.length > 0) {
    group.members[0].role = 'admin';
  }
  await groupRef.update({ members: group.members });
  res.json({ message: 'Left group' });
};