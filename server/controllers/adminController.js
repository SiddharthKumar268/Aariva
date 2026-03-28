// adminController.js — Features 10–14
const Case       = require('../models/Case');
const Decision   = require('../models/Decision');
const Evaluation = require('../models/Evaluation');
const Log        = require('../models/Log');
const User       = require('../models/User');

/* ─────────────────────────────────────────
   Feature 10 — Get all cases (with filter)
   GET /api/admin/cases?status=&severity=&search=
────────────────────────────────────────── */
exports.getAllCases = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.caseStatus = req.query.status;
    if (req.query.severity) filter['disability.severity'] = req.query.severity;
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [
        { 'applicant.firstName': re },
        { 'applicant.lastName':  re },
        { 'applicant.email':     re },
      ];
    }
    const cases = await Case.find(filter).sort({ submissionDate: -1 }).lean();
    res.json(cases);
  } catch (err) {
    console.error('getAllCases error:', err);
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
};

/* ─────────────────────────────────────────
   Feature 11 — Approve case
   POST /api/admin/cases/:id/approve
   Body: { remarks: string }
────────────────────────────────────────── */
exports.approveCase = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Remarks are required for approval' });
    }

    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });
    if (c.caseStatus === 'Approved') {
      return res.status(409).json({ message: 'Case is already approved' });
    }

    const decision = await Decision.create({
      caseId:       c._id,
      adminId:      req.session?.userId,
      adminName:    req.session?.userEmail || 'Admin',
      decisionType: 'Approved',
      decisionDate: new Date(),
      remarks:      remarks.trim(),
    });

    await Case.findByIdAndUpdate(
      req.params.id,
      { $set: { caseStatus: 'Approved', resolvedFlag: true } },
      { runValidators: false }
    );

    if (c.applicant?.email) {
      await User.findOneAndUpdate(
        { email: c.applicant.email },
        { $push: { notifications: {
            message:   `Your disability case (ID: ${c._id}) has been Approved.`,
            type:      'success',
            read:      false,
            createdAt: new Date()
          }}}
      );
    }

    await Log.create({
      caseId:      c._id,
      actor:       req.session?.userId || undefined,
      actionType:  'approve',
      description: 'Case approved by admin',
      details:     remarks.trim().substring(0, 150),
      createdAt:   new Date()
    });

    res.json({ message: 'Case approved', decisionId: decision._id });
  } catch (err) {
    console.error('approveCase error:', err);
    res.status(500).json({ message: 'Failed to approve case' });
  }
};

/* ─────────────────────────────────────────
   Feature 11 — Reject case
   POST /api/admin/cases/:id/reject
   Body: { remarks: string }
────────────────────────────────────────── */
exports.rejectCase = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Remarks are required for rejection' });
    }

    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });

    await Decision.create({
      caseId:       c._id,
      adminId:      req.session?.userId,
      adminName:    req.session?.userEmail || 'Admin',
      decisionType: 'Rejected',
      decisionDate: new Date(),
      remarks:      remarks.trim(),
    });

    await Case.findByIdAndUpdate(
      req.params.id,
      { $set: { caseStatus: 'Rejected', resolvedFlag: true } },
      { runValidators: false }
    );

    if (c.applicant?.email) {
      await User.findOneAndUpdate(
        { email: c.applicant.email },
        { $push: { notifications: {
            message:   `Your disability case (ID: ${c._id}) has been Rejected. Reason: ${remarks.trim()}`,
            type:      'danger',
            read:      false,
            createdAt: new Date()
          }}}
      );
    }

    await Log.create({
      caseId:      c._id,
      actor:       req.session?.userId || undefined,
      actionType:  'reject',
      description: 'Case rejected by admin',
      details:     remarks.trim().substring(0, 150),
      createdAt:   new Date()
    });

    res.json({ message: 'Case rejected' });
  } catch (err) {
    console.error('rejectCase error:', err);
    res.status(500).json({ message: 'Failed to reject case' });
  }
};

/* ─────────────────────────────────────────
   Feature 12 — Request clarification
   POST /api/admin/cases/:id/clarify
   Body: { remarks: string }
────────────────────────────────────────── */
exports.requestClarification = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Clarification details are required' });
    }

    const c = await Case.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Case not found' });

    // FIX: use findByIdAndUpdate + runValidators:false instead of c.save()
    // c.save() re-runs full document validation — old records (submitted before
    // the schema fix) are missing required applicant.firstName/lastName and fail.
    // findByIdAndUpdate with runValidators:false only touches the fields we set.
    await Case.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          caseStatus:            'Clarification Requested',
          'clarificationRequest.requestedBy': req.session?.userId ? String(req.session.userId) : 'admin',
          'clarificationRequest.details':     remarks.trim(),
          'clarificationRequest.requestedAt': new Date(),
          'clarificationRequest.resolved':    false,
        }
      },
      { runValidators: false }
    );

    if (c.submittedBy) {
      await User.findByIdAndUpdate(c.submittedBy, {
        $push: { notifications: {
          message:   `Clarification requested for case ${c._id}: ${remarks.trim()}`,
          type:      'warning',
          read:      false,
          createdAt: new Date()
        }}
      });
    }

    await Log.create({
      caseId:      c._id,
      actor:       req.session?.userId || undefined,
      actionType:  'clarify',
      description: 'Clarification requested',
      details:     remarks.trim().substring(0, 150),
      createdAt:   new Date()
    });

    res.json({ message: 'Clarification request sent' });
  } catch (err) {
    // FIX: was silently swallowing the real error — now logged so you can see what failed
    console.error('requestClarification error:', err);
    res.status(500).json({ message: 'Failed to request clarification', detail: err.message });
  }
};

/* ─────────────────────────────────────────
   Feature 13 — Full case summary (printable)
   GET /api/admin/cases/:id/summary
────────────────────────────────────────── */
exports.getCaseSummary = async (req, res) => {
  try {
    const c         = await Case.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Case not found' });

    const decisions = await Decision.find({ caseId: req.params.id }).sort({ decisionDate: -1 }).lean();
    const evals     = await Evaluation.find({ caseId: req.params.id }).sort({ submittedAt: -1 }).lean();
    const logs      = await Log.find({ caseId: req.params.id }).sort({ createdAt: -1 }).lean();

    res.json({ ...c, decisions, evaluations: evals, logs });
  } catch (err) {
    console.error('getCaseSummary error:', err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

/* ─────────────────────────────────────────
   Feature 14 — Audit logs
   GET /api/admin/logs?type=&caseId=
────────────────────────────────────────── */
exports.getAuditLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)   filter.actionType = req.query.type;
    if (req.query.caseId) filter.caseId     = req.query.caseId;
    const logs = await Log.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(logs);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};