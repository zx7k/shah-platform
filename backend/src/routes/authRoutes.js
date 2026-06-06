const router = require('express').Router();
const authController = require('../controllers/authController');
const authLimiter = require('../middleware/authLimiter');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;   // ← THIS LINE MUST BE PRESENT
