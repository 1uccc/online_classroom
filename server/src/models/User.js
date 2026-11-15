import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { options } from './shared.js';

const schema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  tokenVersion: { type: Number, default: 0, min: 0, select: false },
  role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student', required: true },
  isActive: { type: Boolean, default: true },
}, options);
schema.set('toJSON', { transform(doc, value) { delete value.passwordHash; delete value.tokenVersion; delete value.__v; return value; } });

export async function hashPassword(password) {
  // bcrypt truncates after 72 bytes; reject instead of silently accepting collisions.
  if (Buffer.byteLength(password, 'utf8') > 72) {
    const { AppError } = await import('../utils/AppError.js');
    throw new AppError(400, 'Mật khẩu không được vượt 72 byte UTF-8.', 'INVALID_PASSWORD');
  }
  return bcrypt.hash(password, 12);
}
export const User = mongoose.model('User', schema);
