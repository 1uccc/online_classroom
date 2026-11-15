import { rateLimit } from 'express-rate-limit';

export const passwordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20,
  // Attached after authentication; key the shared self-change/reset budget by admin.
  keyGenerator: req => String(req.user._id),
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Đã thực hiện quá nhiều yêu cầu đổi mật khẩu. Vui lòng thử lại sau.', code: 'RATE_LIMITED' },
});
