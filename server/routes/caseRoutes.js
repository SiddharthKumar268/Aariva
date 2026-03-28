// routes/caseRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/caseController');
const { protect } = require('../middleware/auth');
const upload  = require('../middleware/upload');

router.post('/submit',       protect, upload.array('documents', 10), ctrl.submitCase);
router.get('/my-cases',      protect, ctrl.getMyCases);
router.get('/:id',           protect, ctrl.getCaseById);
router.post('/:id/notes',    protect, ctrl.addNote);
router.get('/:id/track',     protect, ctrl.trackCase);

module.exports = router;