const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate, requireModerator } = require('../middleware/auth');
router.post('/', authenticate, ctrl.submitReport);
router.get('/', authenticate, requireModerator, ctrl.getReports);
router.put('/:reportId/resolve', authenticate, requireModerator, ctrl.resolveReport);
module.exports = router;