import * as authService from '../services/authService.js';
import { success } from '../utils/response.js';

export async function register(req, res) {
  return success(res, await authService.register(req.validated.body), 201, 'Đăng ký thành công.');
}
export async function login(req, res) {
  return success(res, await authService.login(req.validated.body));
}
export function me(req, res) { return success(res, req.user); }
export async function updateMe(req, res) {
  req.user.fullName = req.validated.body.fullName;
  await req.user.save();
  return success(res, req.user);
}
export async function changePassword(req, res) {
  return success(res, await authService.changeOwnPassword(req.user, req.validated.body), 200, 'Đã đổi mật khẩu và kết thúc các phiên đăng nhập cũ.');
}
