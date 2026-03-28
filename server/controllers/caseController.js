// caseController.js
const Case = require('../models/Case');
const Log  = require('../models/Log');
const path = require('path');

/* ─────────────────────────────────────────
   Feature 01 + 02 — Submit Case
   POST /api/cases/submit
   Body: multipart/form-data
     data      = JSON string { applicant:{...}, disability:{...} }
     documents = File[] (via Multer)
────────────────────────────────────────── */
exports.submitCase = async (req, res) => {
  try {
    let payload = {};
    if (req.body.data) payload = JSON.parse(req.body.data);

    const { applicant, disability } = payload;
    if (!applicant || !disability) {
      return res.status(400).json({ message: 'Applicant and disability details are required' });
    }

    // Server-side validation — personal fields
    const missingPersonal = ['firstName', 'lastName', 'dob', 'gender', 'email', 'phone', 'address']
      .filter(k => !applicant[k]);
    if (missingPersonal.length) {
      return res.status(422).json({ message: 'Missing required personal fields', fields: missingPersonal });
    }

    // Server-side validation — disability fields
    // FIX: frontend sends disability.type; validate against that key before remapping
    const missingDisability = ['type', 'severity', 'onsetDate', 'description']
      .filter(k => !disability[k]);
    if (missingDisability.length) {
      return res.status(422).json({ message: 'Missing required disability fields', fields: missingDisability });
    }

    // Build document list from Multer uploads
    const documents = (req.files || []).map(f => ({
      documentId:         f.filename,
      originalName:       f.originalname,
      documentType:       path.extname(f.originalname).replace('.', '').toUpperCase(),
      filePath:           f.path,
      fileSize:           f.size,
      verificationStatus: 'Pending',
      uploadedAt:         new Date()
    }));

    const newCase = new Case({
      submissionDate: new Date(),
      caseStatus:     'Pending',
      applicant: {
        firstName: applicant.firstName,
        lastName:  applicant.lastName,
        dob:       applicant.dob,
        gender:    applicant.gender,
        email:     applicant.email,
        phone:     applicant.phone,
        address:   applicant.address,
      },
      // FIX: map frontend's disability.type → schema field disabilityType
      disability: {
        disabilityType: disability.type,
        severity:       disability.severity,
        onsetDate:      disability.onsetDate,
        affectedAreas:  disability.affectedAreas || '',
        description:    disability.description,
        treatment:      disability.treatment || '',
      },
      documents,
      submittedBy: req.session?.userId,
      notes:       [],
      escalated:   false,
    });

    await newCase.save();

    await Log.create({
      caseId:      newCase._id,
      actor:       req.session?.userId,
      actionType:  'create',
      description: `Case submitted for ${applicant.firstName} ${applicant.lastName}`,
      createdAt:   new Date()
    });

    res.status(201).json({
      message: 'Case submitted successfully',
      caseId:  newCase._id,
      _id:     newCase._id
    });
  } catch (err) {
    console.error('submitCase error:', err);
    res.status(500).json({ message: 'Server error during case submission' });
  }
};

/* ─────────────────────────────────────────
   Feature 03 — Cases submitted by this case worker
   GET /api/cases/my-cases
────────────────────────────────────────── */
exports.getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ submittedBy: req.session.userId })
      .sort({ submissionDate: -1 })
      .lean();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
};

/* ─────────────────────────────────────────
   Get single case detail
   GET /api/cases/:id
────────────────────────────────────────── */
exports.getCaseById = async (req, res) => {
  try {
    const c = await Case.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch case' });
  }
};

/* ─────────────────────────────────────────
   Feature 04 — Add inline case note
   POST /api/cases/:id/notes
   Body: { text: string }
────────────────────────────────────────── */
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const note = {
      text:      text.trim(),
      author:    req.session?.userEmail || 'Case Worker',
      createdAt: new Date()
    };

    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: note } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Case not found' });

    await Log.create({
      caseId:      req.params.id,
      actor:       req.session?.userId,
      actionType:  'note',
      description: 'Note added to case',
      details:     text.trim().substring(0, 100),
      createdAt:   new Date()
    });

    res.json({ message: 'Note saved', note });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save note' });
  }
};

/* ─────────────────────────────────────────
   Feature 15 — Track case status (applicant view)
   GET /api/cases/:id/track
────────────────────────────────────────── */
exports.trackCase = async (req, res) => {
  try {
    const c = await Case.findById(req.params.id)
      .select('applicant disability caseStatus submissionDate escalated notes')
      .lean();
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: 'Failed to track case' });
  }
};