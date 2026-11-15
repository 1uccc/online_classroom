import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, assert } from '../utils/AppError.js';

export function signToken(user) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(user._id), algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'online-classroom', audience: 'online-classroom-client',
  });
}

async function resolveUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'online-classroom', audience: 'online-classroom-client',
    });
    if (typeof payload !== 'object' || !/^[a-f\d]{24}$/i.test(payload.sub || '')) throw new Error();
  } catch {
    throw new AppError(401, 'JWT không hợp lệ hoặc đã hết hạn.', 'INVALID_TOKEN');
  }
  const user = await User.findById(payload.sub);
  assert(user, 401, 'Tài khoản không tồn tại.', 'INVALID_TOKEN');
  assert(user.isActive, 403, 'Tài khoản đã bị khóa.', 'ACCOUNT_DISABLED');
  return user;
}

export async function optionalAuthenticate(req, res, next) {
  const header = req.get('authorization');
  if (header) {
    const match = /^Bearer (\S+)$/i.exec(header);
    assert(match, 401, 'Authorization header không hợp lệ.', 'INVALID_TOKEN');
    req.user = await resolveUser(match[1]);
  }
  next();
}

export async function authenticate(req, res, next) {
  await optionalAuthenticate(req, res, () => {});
  assert(req.user, 401, 'Vui lòng đăng nhập.', 'AUTHENTICATION_REQUIRED');
  next();
}
