const router = require('express').Router();
const groupCtrl = require('../controllers/groupController');
const keyCtrl = require('../controllers/groupKeyController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, groupCtrl.createGroup);
router.get('/', authenticate, groupCtrl.listGroups);
router.get('/:groupId', authenticate, groupCtrl.getGroup);
router.put('/:groupId/invite', authenticate, groupCtrl.inviteToGroup);
router.put('/:groupId/members/:targetUid', authenticate, groupCtrl.updateMember);
router.put('/:groupId/leave', authenticate, groupCtrl.leaveGroup);
router.post('/:groupId/keys', authenticate, keyCtrl.setKeys);
router.get('/:groupId/keys/:uid', authenticate, keyCtrl.getKey);
module.exports = router;