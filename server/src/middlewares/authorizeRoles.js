import { assert } from '../utils/AppError.js';

export const authorizeRoles = (...roles) => (req, res, next) => {
  assert(req.user, 401, 'Vui lòng đăng nhập.', 'AUTHENTICATION_REQUIRED');
  assert(roles.includes(req.user.role), 403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN');
  next();
};
