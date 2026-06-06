const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
router.get('/stats', authenticate, requireAdmin, ctrl.getDashboardStats);
router.get('/audit-logs', authenticate, requireAdmin, ctrl.getAuditLogs);
module.exports = router;