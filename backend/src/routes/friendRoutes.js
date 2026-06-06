const router = require('express').Router();
const friendCtrl = require('../controllers/friendController');
const { authenticate } = require('../middleware/auth');
router.post('/request', authenticate, friendCtrl.sendRequest);
router.post('/respond', authenticate, friendCtrl.respondToRequest);
router.get('/requests', authenticate, friendCtrl.getRequests);
module.exports = router;