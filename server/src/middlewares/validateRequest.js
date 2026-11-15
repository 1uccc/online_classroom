import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ObjectId không hợp lệ.');

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(new AppError(400, 'Dữ liệu không hợp lệ.', 'VALIDATION_ERROR',
      result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))));
    req.validated ??= {};
    req.validated[source] = result.data;
    next();
  };
}

export function validateIds(req, res, next) {
  for (const [key, value] of Object.entries(req.params)) {
    if (key.endsWith('Id') && !objectId.safeParse(value).success) {
      return next(new AppError(400, `${key} không hợp lệ.`, 'INVALID_ID'));
    }
  }
  next();
}
