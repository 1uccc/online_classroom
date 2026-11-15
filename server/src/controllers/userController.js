import { User } from '../models/User.js';
import { register, resetUserPassword } from '../services/authService.js';
import { sameId } from '../services/accessService.js';
import { success, list, escapeRegex } from '../utils/response.js';
import { assert } from '../utils/AppError.js';

export async function getUsers(req, res) {
  const q = req.validated.query;
  const filter = {};
  if (q.role) filter.role = q.role;
  if (q.isActive !== undefined) filter.isActive = q.isActive;
  if (q.search) filter.$or = ['fullName', 'email'].map(field => ({ [field]: { $regex: escapeRegex(q.search), $options: 'i' } }));
  return list(res, User, filter, q);
}
export async function createUser(req, res) {
  return success(res, await register(req.validated.body, req.validated.body.role), 201);
}
export async function getUser(req, res) {
  const user = await User.findById(req.params.userId);
  assert(user, 404, 'Không tìm thấy người dùng.', 'NOT_FOUND');
  return success(res, user);
}
export async function updateStatus(req, res) {
  assert(!sameId(req.user._id, req.params.userId) || req.validated.body.isActive, 409, 'Không thể tự khóa tài khoản.', 'SELF_LOCK');
  const user = await User.findById(req.params.userId);
  assert(user, 404, 'Không tìm thấy người dùng.', 'NOT_FOUND');
  user.isActive = req.validated.body.isActive;
  await user.save();
  return success(res, user);
}
export async function resetPassword(req, res) {
  return success(res, await resetUserPassword(req.user, req.params.userId, req.validated.body), 200, 'Đã đặt lại mật khẩu và kết thúc các phiên đăng nhập cũ.');
}
