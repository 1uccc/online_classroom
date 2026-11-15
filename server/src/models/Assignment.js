import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  course: ref('Course'), title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 20000 }, dueAt: { type: Date, default: null },
  maxScore: { type: Number, default: 10, min: Number.MIN_VALUE, max: 10000 },
  submissionType: { type: String, enum: ['text', 'file', 'both'], required: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
}, options);
schema.index({ course: 1, dueAt: 1 });
export const Assignment = mongoose.model('Assignment', schema);
