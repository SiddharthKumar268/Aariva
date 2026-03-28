// routes/evaluationRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/evaluationController');
const { protect, requireRole } = require('../middleware/auth');
const upload  = require('../middleware/upload');

router.get('/queue',   protect, requireRole('doctor'), ctrl.getQueue);
router.post('/submit', protect, requireRole('doctor'), upload.fields([{ name: 'report', maxCount: 1 }]), ctrl.submitEvaluation);

module.exports = router;