import mongoose from 'mongoose';
import { options, ref, fileSchema } from './shared.js';

const schema = new mongoose.Schema({
  course: ref('Course'), title: { type: String, required: true, trim: true, maxlength: 200 },
  type: { type: String, enum: ['pdf', 'video', 'text'], required: true },
  content: { type: String, maxlength: 100000 }, videoUrl: String,
  file: { type: fileSchema, default: undefined }, position: { type: Number, min: 0, default: 0 },
}, options);
schema.pre('validate', function() {
  if (this.type === 'pdf' && !this.file) this.invalidate('file', 'Tài liệu PDF cần file.');
  if (this.type === 'text' && !this.content?.trim()) this.invalidate('content', 'Tài liệu text cần nội dung.');
  if (this.type === 'video' && !this.videoUrl) this.invalidate('videoUrl', 'Tài liệu video cần URL.');
});
schema.index({ course: 1, position: 1 });
export const Material = mongoose.model('Material', schema);
