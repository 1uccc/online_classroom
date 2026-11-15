import multer from 'multer';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Không tìm thấy API.', code: 'NOT_FOUND' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.statusCode || 500;
  let message = err.message;
  let code = err.code || 'INTERNAL_ERROR';
  let errors = err.errors;
  if (err.code === 11000) {
    status = 409; code = 'DUPLICATE_RESOURCE'; message = 'Dữ liệu đã tồn tại.'; errors = undefined;
  } else if (err.name === 'ValidationError') {
    status = 400; code = 'VALIDATION_ERROR'; message = 'Dữ liệu không hợp lệ.';
    errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400; code = 'INVALID_VALUE'; message = 'Giá trị không hợp lệ.'; errors = undefined;
  } else if (err.name === 'VersionError') {
    status = 409; code = 'CONCURRENT_UPDATE'; message = 'Dữ liệu vừa thay đổi. Vui lòng tải lại.'; errors = undefined;
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = err.code; message = 'File vượt giới hạn hoặc trường upload không hợp lệ.'; errors = undefined;
  } else if (err.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request vượt giới hạn.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'JSON không hợp lệ.';
  }
  if (status >= 500) {
    if (env.NODE_ENV !== 'test') console.error({ name: err.name, code: err.code || 'INTERNAL_ERROR' });
    message = 'Lỗi máy chủ.'; code = 'INTERNAL_ERROR'; errors = undefined;
  }
  res.status(status).json({ success: false, message, code, ...(errors && { errors }) });
}
