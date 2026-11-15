import mongoose from 'mongoose';
import { options } from './shared.js';

export const Category = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, default: '', maxlength: 2000 },
  isActive: { type: Boolean, default: true },
}, options));
