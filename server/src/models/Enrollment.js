import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  student: ref('User'), course: ref('Course'),
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  enrolledAt: { type: Date, default: Date.now }, completedAt: { type: Date, default: null },
}, options);
schema.index({ student: 1, course: 1 }, { unique: true });
schema.index({ course: 1, status: 1 });
export const Enrollment = mongoose.model('Enrollment', schema);
