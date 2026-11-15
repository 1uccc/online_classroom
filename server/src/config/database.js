import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  // Ensure unique indexes exist before accepting traffic in this initial project.
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
}
