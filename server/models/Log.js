const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  caseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType:  { type: String, enum: ['create','approve','reject','clarify','eval','note','escalate','login','other'], default: 'other' },
  description: String,
  details:     String,
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.models.Log || mongoose.model('Log', LogSchema);