// evaluationController.js — Features 06–09
const Case       = require('../models/Case');
const Evaluation = require('../models/Evaluation');
const Log        = require('../models/Log');

/* ─────────────────────────────────────────
   Feature 06 + 09 — Evaluation queue (assigned + specialist)
   GET /api/evaluation/queue
────────────────────────────────────────── */
exports.getQueue = async (req, res) => {
  try {
    // Cases that need evaluation: status is Pending or Under Review, no completed eval yet
    const cases = await Case.find({
      caseStatus: { $in: ['Pending', 'Under Review'] }
    })
    .sort({ submissionDate: 1 }) // oldest first
    .lean();

    // Attach evalStatus from Evaluation collection
    const enriched = await Promise.all(cases.map(async c => {
      const eval_ = await Evaluation.findOne({ caseId: c._id }).lean();
      return {
        ...c,
        evalStatus:        eval_ ? 'completed' : 'pending',
        specialistRequired: c.specialistRequired || false,
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load evaluation queue' });
  }
};

/* ─────────────────────────────────────────
   Feature 07 + 08 — Submit evaluation (+ optional treatment plan)
   POST /api/evaluation/submit
   Body: multipart/form-data
     data = JSON string
     report = File (PDF, optional)
────────────────────────────────────────── */
exports.submitEvaluation = async (req, res) => {
  try {
    let payload = {};
    if (req.body.data) payload = JSON.parse(req.body.data);

    const {
      caseId, evalType, evalDate, diagnosis,
      disabilityPercentage, prognosis, specialistRefer,
      treatmentPlan, treatmentDuration, referSpecialist
    } = payload;

    if (!caseId || !evalType || !diagnosis || !prognosis) {
      return res.status(400).json({ message: 'Missing required evaluation fields' });
    }
    if (diagnosis.length < 30) {
      return res.status(422).json({ message: 'Diagnosis must be at least 30 characters' });
    }
    const pct = Number(disabilityPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(422).json({ message: 'Disability percentage must be between 0 and 100' });
    }

    const reportFile = req.files?.report?.[0] || req.file || null;

    const evaluation = new Evaluation({
      caseId,
      doctorId:             req.session?.userId,
      doctorName:           req.session?.userEmail || 'Doctor',
      evalType,
      evalDate:             evalDate || new Date(),
      diagnosis,
      disabilityPercentage: pct,
      prognosis,
      specialistRefer:      specialistRefer || false,
      // Feature 08 — treatment recommendation (UC-03 Alt Course A)
      treatmentPlan:        treatmentPlan || null,
      treatmentDuration:    treatmentDuration || null,
      referSpecialist:      referSpecialist || null,
      reportFile:           reportFile ? reportFile.path : null,
      submittedAt:          new Date(),
    });

    await evaluation.save();

    // Update case status & specialistRequired flag
    const caseUpdate = {
      caseStatus:         'Under Review',
      'evaluation.id':    evaluation._id,
    };
    if (specialistRefer) caseUpdate.specialistRequired = true;

    await Case.findByIdAndUpdate(caseId, caseUpdate);

    // Audit log
    await Log.create({
      caseId,
      actor:       req.session?.userId,
      actionType:  'eval',
      description: `Medical evaluation submitted — ${evalType}`,
      details:     `Prognosis: ${prognosis}, Disability: ${pct}%`,
      createdAt:   new Date()
    });

    res.status(201).json({ message: 'Evaluation submitted successfully', evaluationId: evaluation._id });
  } catch (err) {
    console.error('submitEvaluation error:', err);
    res.status(500).json({ message: 'Server error during evaluation submission' });
  }
};