import mongoose from 'mongoose';

export const options = { timestamps: true, optimisticConcurrency: true };
export const ref = (model, required = true) => ({ type: mongoose.Schema.Types.ObjectId, ref: model, required });
export const fileSchema = new mongoose.Schema({
  storageKey: { type: String, required: true, select: false },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 1 },
});
fileSchema.set('toJSON', { transform(doc, value) { delete value.storageKey; return value; } });
