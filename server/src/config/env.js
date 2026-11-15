import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('1h'),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(25).default(10),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  // Report field names only; never log secret values or connection credentials.
  throw new Error(`Invalid environment variables: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`);
}
const serverRoot = fileURLToPath(new URL('../../', import.meta.url));
export const env = Object.freeze({
  ...result.data,
  UPLOAD_DIR: path.resolve(serverRoot, result.data.UPLOAD_DIR),
});
