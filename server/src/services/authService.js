import bcrypt from 'bcryptjs';
import { User, hashPassword } from '../models/User.js';
import { signToken } from '../middlewares/authenticate.js';
import { assert } from '../utils/AppError.js';

export async function register(data, role = 'student') {
  const user = await User.create({ fullName: data.fullName, email: data.email, passwordHash: await hashPassword(data.password), role });
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  assert(user && Buffer.byteLength(password, 'utf8') <= 72 && await bcrypt.compare(password, user.passwordHash), 401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
  assert(user.isActive, 403, 'Tài khoản đã bị khóa.', 'ACCOUNT_DISABLED');
  return { accessToken: signToken(user), tokenType: 'Bearer', user };
}

export async function changeOwnPassword(actor, { currentPassword, newPassword }) {
  assert(actor.role === 'admin', 403, 'Chỉ Admin được thực hiện thao tác này.', 'FORBIDDEN');
  const user = await User.findById(actor._id).select('+passwordHash +tokenVersion');
  assert(user?.isActive, 403, 'Tài khoản không còn hoạt động.', 'ACCOUNT_DISABLED');
  // A wrong current password is a form error, not an invalid JWT.
  assert(Buffer.byteLength(currentPassword, 'utf8') <= 72 && await bcrypt.compare(currentPassword, user.passwordHash),
    400, 'Mật khẩu hiện tại không đúng.', 'INVALID_CURRENT_PASSWORD');
  assert(!await bcrypt.compare(newPassword, user.passwordHash), 400, 'Mật khẩu mới phải khác mật khẩu hiện tại.', 'PASSWORD_UNCHANGED');
  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  // Keep the initiating admin session usable while revoking all previously issued tokens.
  return { accessToken: signToken(user), tokenType: 'Bearer', user };
}

export async function resetUserPassword(actor, userId, { newPassword }) {
  assert(actor.role === 'admin', 403, 'Chỉ Admin được đặt lại mật khẩu.', 'FORBIDDEN');
  const user = await User.findById(userId).select('+passwordHash +tokenVersion');
  assert(user, 404, 'Không tìm thấy người dùng.', 'NOT_FOUND');
  assert(['student', 'teacher'].includes(user.role), 403, 'Chỉ đặt lại mật khẩu Sinh viên hoặc Giảng viên. Để đổi mật khẩu của mình, hãy mở Hồ sơ cá nhân.', 'FORBIDDEN');
  assert(!await bcrypt.compare(newPassword, user.passwordHash), 400, 'Mật khẩu mới phải khác mật khẩu hiện tại.', 'PASSWORD_UNCHANGED');
  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  return user;
}
