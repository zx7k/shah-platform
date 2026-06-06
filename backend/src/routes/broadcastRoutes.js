const router = require('express').Router();
const ctrl = require('../controllers/broadcastController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ctrl.createBroadcast);
router.get('/', authenticate, ctrl.listBroadcasts);
router.get('/:channelId', authenticate, ctrl.getBroadcast);
router.post('/:channelId/follow', authenticate, ctrl.followChannel);
router.post('/:channelId/unfollow', authenticate, ctrl.unfollowChannel);
router.post('/:channelId/invite-codes', authenticate, ctrl.generateInviteCode);
router.post('/join-by-code', authenticate, ctrl.joinByCode);
router.post('/:channelId/messages', authenticate, ctrl.postMessage);
router.get('/:channelId/messages', authenticate, ctrl.getMessages);
router.put('/:channelId/messages/:msgId/pin', authenticate, ctrl.togglePin);
module.exports = router;