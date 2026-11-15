import bcrypt from 'bcryptjs';
import { User, hashPassword } from '../models/User.js';
import { signToken } from '../middlewares/authenticate.js';
import { assert } from '../utils/AppError.js';

export async function register(data, role = 'student') {
  const user = await User.create({ fullName: data.fullName, email: data.email, passwordHash: await hashPassword(data.password), role });
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  assert(user && Buffer.byteLength(password, 'utf8') <= 72 && await bcrypt.compare(password, user.passwordHash), 401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
  assert(user.isActive, 403, 'Tài khoản đã bị khóa.', 'ACCOUNT_DISABLED');
  return { accessToken: signToken(user), tokenType: 'Bearer', user };
}
