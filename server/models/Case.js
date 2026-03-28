// models/Case.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  author:    { type: String },
  createdAt: { type: Date, default: Date.now }
});

const DocumentSchema = new mongoose.Schema({
  documentId:         String,
  originalName:       String,
  documentType:       String,
  filePath:           String,
  fileSize:           Number,
  verificationStatus: { type: String, default: 'Pending' },
  uploadedAt:         { type: Date, default: Date.now }
});

// FIX: disability.type conflicts with Mongoose's reserved { type: X } schema syntax.
// Mongoose interprets `disability: { type: String, severity: ... }` as
// "disability is a String field" — ignoring all other sub-fields.
// Solution: rename the field to `disabilityType` throughout.
const DisabilitySchema = new mongoose.Schema({
  disabilityType: { type: String },           // was: type: String (caused the cast error)
  severity:       { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
  onsetDate:      { type: String },
  affectedAreas:  { type: String },
  description:    { type: String },
  treatment:      { type: String },
}, { _id: false });

const CaseSchema = new mongoose.Schema({
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submissionDate: { type: Date, default: Date.now },
  caseStatus:     {
    type: String,
    enum: [
      'Pending', 'Under Review', 'Medical Evaluation',
      'Approved', 'Rejected', 'Clarification Requested', 'Escalated'
    ],
    default: 'Pending'
  },
  resolvedFlag: { type: Boolean, default: false },
  escalated:    { type: Boolean, default: false },
  escalatedAt:  Date,

  applicant: {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    dob:       String,
    gender:    String,
    email:     String,
    phone:     String,
    address:   String,
  },

  disability: { type: DisabilitySchema, default: () => ({}) },

  documents: [DocumentSchema],
  notes:     [NoteSchema],

  specialistRequired: { type: Boolean, default: false },

  clarificationRequest: {
    requestedBy: String,
    details:     String,
    requestedAt: Date,
    resolved:    { type: Boolean, default: false }
  },

  evaluation: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation' }
  }
}, { timestamps: true });

module.exports = mongoose.models.Case || mongoose.model('Case', CaseSchema);