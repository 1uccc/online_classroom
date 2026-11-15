import { User } from '../models/User.js';
import { AppError, assert } from '../utils/AppError.js';

export async function updateUserProfile(actor, userId, changes) {
  assert(actor.role === 'admin', 403, 'Chỉ Admin được chỉnh sửa hồ sơ người dùng.', 'FORBIDDEN');
  const user = await User.findById(userId);
  assert(user, 404, 'Không tìm thấy người dùng.', 'NOT_FOUND');
  assert(['student', 'teacher'].includes(user.role), 403, 'Chỉ được chỉnh sửa hồ sơ Sinh viên hoặc Giảng viên.', 'FORBIDDEN');
  if (changes.fullName !== undefined) user.fullName = changes.fullName;
  if (changes.email !== undefined) user.email = changes.email;
  try {
    return await user.save();
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
      throw new AppError(409, 'Email này đã được sử dụng bởi tài khoản khác.', 'EMAIL_ALREADY_EXISTS');
    }
    throw error;
  }
}
