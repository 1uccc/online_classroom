import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều request.', code: 'RATE_LIMITED' } }));
app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/v1', routes);
// Do not expose uploads with express.static; all file access is authorized by routes.
app.use(notFound);
app.use(errorHandler);
