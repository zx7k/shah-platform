const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId, role = 'user') => {
  return jwt.sign({ uid: userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };