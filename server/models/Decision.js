const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
  caseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  adminId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName:    String,
  decisionType: { type: String, enum: ['Approved', 'Rejected', 'Clarification Requested'], required: true },
  decisionDate: { type: Date, default: Date.now },
  remarks:      { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Decision || mongoose.model('Decision', DecisionSchema);