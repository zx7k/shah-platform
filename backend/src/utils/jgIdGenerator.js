const db = require('./firestore');

const generateJGID = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id;
  let exists = true;
  while (exists) {
    id = 'JG' + Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const snap = await db.collection('users').where('jgId', '==', id).get();
    exists = !snap.empty;
  }
  return id;
};

module.exports = generateJGID;