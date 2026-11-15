import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 20000 },
  teacher: ref('User'), category: ref('Category'), thumbnailUrl: String,
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
}, options);
schema.index({ teacher: 1, status: 1 });
schema.index({ category: 1, status: 1 });
export const Course = mongoose.model('Course', schema);
