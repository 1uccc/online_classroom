import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { setAccessToken, hasAccessToken, request } from '../api/httpClient';
import AuthPage from '../pages/AuthPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';

const teacher = { _id: 'teacher-id', fullName: 'Giảng viên An', role: 'teacher', email: 'teacher@example.com' };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { setAccessToken(null); vi.stubGlobal('fetch', vi.fn()); });

function SessionProbe() {
  const { user, logout, loading } = useAuth();
  return <><span>{loading ? 'Đang xác thực' : user?.fullName || 'Khách'}</span><button onClick={logout}>Thoát</button></>;
}
function LoginDestination() { const location = useLocation(); return <p>Đăng nhập để mở {location.state?.from}</p>; }

it('redirects a guest and retains the intended destination', async () => {
  render(<MemoryRouter initialEntries={['/teaching']}><AuthProvider><Routes><Route path="/login" element={<LoginDestination />} /><Route element={<ProtectedRoute roles={['teacher']} />}><Route path="/teaching" element={<p>Lớp của tôi</p>} /></Route></Routes></AuthProvider></MemoryRouter>);
  expect(await screen.findByText('Đăng nhập để mở /teaching')).toBeInTheDocument();
});

it('logs in through the real form and stores the returned access token', async () => {
  fetch.mockResolvedValue(response({ data: { accessToken: 'valid-token', user: teacher } }));
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/login']}><AuthProvider><Routes><Route path="/login" element={<AuthPage />} /><Route path="/" element={<SessionProbe />} /></Routes></AuthProvider></MemoryRouter>);
  await user.type(screen.getByLabelText('Địa chỉ email'), teacher.email);
  await user.type(screen.getByLabelText('Mật khẩu'), 'ClassroomTest123!');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText(teacher.fullName)).toBeInTheDocument(); expect(hasAccessToken()).toBe(true);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: teacher.email, password: 'ClassroomTest123!' });
  await user.click(screen.getByText('Thoát')); expect(screen.getByText('Khách')).toBeInTheDocument(); expect(hasAccessToken()).toBe(false);
});

it('restores a session from the server and blocks a role mismatch', async () => {
  setAccessToken('saved-token'); fetch.mockResolvedValue(response({ data: teacher }));
  render(<MemoryRouter initialEntries={['/admin']}><AuthProvider><Routes><Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin" element={<p>Dữ liệu quản trị bí mật</p>} /></Route></Routes></AuthProvider></MemoryRouter>);
  expect(await screen.findByText('Bạn không có quyền truy cập')).toBeInTheDocument();
  expect(screen.queryByText('Dữ liệu quản trị bí mật')).not.toBeInTheDocument();
  expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer saved-token');
});

it('does not restore a stale user after logout while /me is pending', async () => {
  setAccessToken('saved-token'); let resolve;
  fetch.mockReturnValue(new Promise(done => { resolve = done; }));
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  fireEvent.click(screen.getByText('Thoát')); resolve(response({ data: teacher }));
  await waitFor(() => expect(screen.getByText('Khách')).toBeInTheDocument());
  expect(screen.queryByText(teacher.fullName)).not.toBeInTheDocument();
});

it('clears the visible session when the server disables the account', async () => {
  setAccessToken('saved-token'); fetch.mockResolvedValueOnce(response({ data: teacher }));
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await screen.findByText(teacher.fullName);
  fetch.mockResolvedValueOnce(response({ message: 'Tài khoản đã bị khóa.', code: 'ACCOUNT_DISABLED' }, 403));
  await expect(request('/courses/mine')).rejects.toMatchObject({ status: 403 });
  expect(await screen.findByText('Khách')).toBeInTheDocument();
});
