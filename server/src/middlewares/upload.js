import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const accepted = new Set(['application/pdf', 'text/plain']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 5, fields: 8, fieldSize: 110000, parts: 13 },
  fileFilter(req, file, callback) {
    callback(accepted.has(file.mimetype) ? null : new AppError(415, 'Chỉ hỗ trợ file PDF và TXT.', 'UNSUPPORTED_FILE_TYPE'), accepted.has(file.mimetype));
  },
});
export const materialUpload = upload.single('file');
export const submissionUpload = upload.array('attachments', 5);
