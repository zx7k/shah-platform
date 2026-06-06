// backend/src/services/emailService.js
const emailjs = require('@emailjs/nodejs');
const config = require('../config/emailjs');

const sendVerificationCode = async (email, code) => {
  try {
    await emailjs.send(
      config.serviceID,
      config.templateID,
      { to_email: email, code },
      {
        publicKey: config.publicKey,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    return true;
  } catch (error) {
    console.error('EmailJS error:', error);
    throw new Error('Failed to send verification code');
  }
};

module.exports = { sendVerificationCode };