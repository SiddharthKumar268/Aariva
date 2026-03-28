// models/Evaluation.js
const mongoose = require('mongoose');

const EvalSchema = new mongoose.Schema({
  caseId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  doctorId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName:           String,
  evalType:             String,
  evalDate:             Date,
  diagnosis:            { type: String, required: true },
  disabilityPercentage: { type: Number, min: 0, max: 100 },
  prognosis:            String,
  specialistRefer:      { type: Boolean, default: false },
  treatmentPlan:        String,
  treatmentDuration:    String,
  referSpecialist:      String,
  reportFile:           String,
  submittedAt:          { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', EvalSchema);

// ─────────────────────────────────────────────────────────────

// models/Decision.js  (save as separate file: server/models/Decision.js)
const DecisionSchema = new mongoose.Schema({
  caseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  adminId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName:    String,
  decisionType: { type: String, enum: ['Approved', 'Rejected', 'Clarification Requested'], required: true },
  decisionDate: { type: Date, default: Date.now },
  remarks:      { type: String, required: true },
}, { timestamps: true });

const Decision = mongoose.models.Decision || mongoose.model('Decision', DecisionSchema);

// ─────────────────────────────────────────────────────────────

// models/Log.js  (save as separate file: server/models/Log.js)
const LogSchema = new mongoose.Schema({
  caseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType:  { type: String, enum: ['create','approve','reject','clarify','eval','note','escalate','login','other'] },
  description: String,
  details:     String,
  createdAt:   { type: Date, default: Date.now }
});

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

module.exports = { Decision, Log };