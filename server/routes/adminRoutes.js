// routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/cases',                    protect, requireRole('admin'), ctrl.getAllCases);
router.post('/cases/:id/approve',       protect, requireRole('admin'), ctrl.approveCase);
router.post('/cases/:id/reject',        protect, requireRole('admin'), ctrl.rejectCase);
router.post('/cases/:id/clarify',       protect, requireRole('admin'), ctrl.requestClarification);
router.get('/cases/:id/summary',        protect, requireRole('admin'), ctrl.getCaseSummary);
router.get('/logs',                     protect, requireRole('admin'), ctrl.getAuditLogs);

module.exports = router;