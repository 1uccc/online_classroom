import mongoose from 'mongoose';
import { options, ref, fileSchema } from './shared.js';

const schema = new mongoose.Schema({
  assignment: ref('Assignment'), student: ref('User'),
  textAnswer: { type: String, default: '', maxlength: 100000 }, attachments: { type: [fileSchema], default: [] },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  score: { type: Number, min: 0, default: null }, feedback: { type: String, default: '', maxlength: 10000 },
  gradedBy: ref('User', false), gradedAt: { type: Date, default: null },
}, options);
schema.pre('validate', function() {
  if (!this.textAnswer?.trim() && !this.attachments.length) this.invalidate('textAnswer', 'Bài nộp cần nội dung hoặc file.');
});
schema.index({ assignment: 1, student: 1 }, { unique: true });
export const Submission = mongoose.model('Submission', schema);
