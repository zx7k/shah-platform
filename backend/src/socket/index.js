const db = require('../utils/firestore');
const admin = require('../config/firebase-admin');

module.exports = (io, socket) => {
  const uid = socket.user.uid;
  
  // Private chats
  socket.on('chat:join', async ({ chatId }) => {
    const doc = await db.collection('chats').doc(chatId).get();
    if (doc.exists && doc.data().participants.includes(uid)) {
      socket.join(`chat:${chatId}`);
      socket.to(`chat:${chatId}`).emit('user:online', { uid });
    }
  });
  socket.on('chat:message', async ({ chatId, ciphertext, iv }) => {
    const ref = db.collection('chats').doc(chatId);
    const doc = await ref.get();
    if (!doc.exists || !doc.data().participants.includes(uid)) return;
    const msg = { sender: uid, ciphertext, iv, createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'sent' };
    const docRef = await ref.collection('messages').add(msg);
    io.to(`chat:${chatId}`).emit('chat:new_message', { id: docRef.id, ...msg, createdAt: new Date().toISOString() });
  });
  socket.on('typing:start', ({ chatId }) => socket.to(`chat:${chatId}`).emit('typing:start', { uid }));
  socket.on('typing:stop', ({ chatId }) => socket.to(`chat:${chatId}`).emit('typing:stop', { uid }));
  
  // Groups
  socket.on('group:join', async ({ groupId }) => {
    const doc = await db.collection('groups').doc(groupId).get();
    if (doc.exists && doc.data().members.some(m => m.uid === uid)) {
      socket.join(`group:${groupId}`);
    }
  });
  socket.on('group:message', async ({ groupId, ciphertext, iv }) => {
    const ref = db.collection('groups').doc(groupId);
    const doc = await ref.get();
    if (!doc.exists) return;
    const member = doc.data().members.find(m => m.uid === uid);
    if (!member || member.mutedUntil?.toDate() > new Date()) return;
    const msg = { sender: uid, ciphertext, iv, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const docRef = await ref.collection('messages').add(msg);
    io.to(`group:${groupId}`).emit('group:new_message', { id: docRef.id, ...msg, createdAt: new Date().toISOString() });
  });
  
  // Broadcasts
  socket.on('broadcast:join', async ({ channelId }) => {
    const doc = await db.collection('broadcasts').doc(channelId).get();
    if (doc.exists && (doc.data().isOfficial || doc.data().members.includes(uid))) {
      socket.join(`broadcast:${channelId}`);
    }
  });
  socket.on('broadcast:message', async ({ channelId, text }) => {
    const ref = db.collection('broadcasts').doc(channelId);
    const doc = await ref.get();
    if (!doc.exists) return;
    const data = doc.data();
    const canPost = data.postPermission === 'members' || (data.postPermission === 'admin' && data.createdBy === uid);
    if (!canPost) return;
    const msg = { sender: uid, text, pinned: false, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const msgRef = await ref.collection('messages').add(msg);
    io.to(`broadcast:${channelId}`).emit('broadcast:new_message', { id: msgRef.id, ...msg, createdAt: new Date().toISOString() });
  });
  
  socket.on('disconnect', () => {});
};