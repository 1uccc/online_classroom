import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { PasswordForm } from '../components/common/PasswordForm';
import ProfilePage from '../pages/ProfilePage';
import UsersPage from '../pages/admin/UsersPage';
import { request, setAccessToken } from '../api/httpClient';

const admin = { _id: 'admin-id', role: 'admin', fullName: 'Admin', email: 'admin@example.com' };
const newPassword = 'NewPasswordForTest123!';
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { setAccessToken(null); vi.stubGlobal('fetch', vi.fn()); });

async function fillPasswords(user, { current = false, confirmation = newPassword } = {}) {
  if (current) await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'ExistingPassword123!');
  await user.type(screen.getByLabelText('Mật khẩu mới'), newPassword);
  await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), confirmation);
}
function Ready({ children }) { const { user } = useAuth(); return user ? children : <p>Đang xác thực</p>; }

it('checks password confirmation before sending any request', async () => {
  const submit = vi.fn(); const user = userEvent.setup();
  render(<ToastProvider><PasswordForm onSubmit={submit} /></ToastProvider>);
  await fillPasswords(user, { confirmation: 'DifferentPassword123!' });
  await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Xác nhận mật khẩu không khớp.');
  expect(submit).not.toHaveBeenCalled();
});

it('preserves form values when the server rejects the current password', async () => {
  const submit = vi.fn().mockRejectedValue(new Error('Mật khẩu hiện tại không đúng.'));
  const user = userEvent.setup();
  render(<ToastProvider><PasswordForm requireCurrent onSubmit={submit} /></ToastProvider>);
  await fillPasswords(user, { current: true }); await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu hiện tại không đúng.');
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue(newPassword);
});

it('sends only the new password during a reset and clears it after success', async () => {
  const submit = vi.fn().mockResolvedValue({}); const saved = vi.fn(); const user = userEvent.setup();
  render(<ToastProvider><PasswordForm onSubmit={submit} onSuccess={saved} /></ToastProvider>);
  await fillPasswords(user); await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
  await waitFor(() => expect(saved).toHaveBeenCalledOnce());
  expect(submit).toHaveBeenCalledWith({ newPassword });
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('');
  expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toHaveValue('');
});

it('keeps the admin signed in with the newly issued token after changing their password', async () => {
  setAccessToken('original-token');
  fetch.mockImplementation(async (url, options) => url.endsWith('/auth/me/password') ? response({ data: { accessToken: 'rotated-token', user: admin } }) : response({ data: admin }));
  const user = userEvent.setup();
  render(<AuthProvider><ToastProvider><Ready><ProfilePage /></Ready></ToastProvider></AuthProvider>);
  await screen.findByText('Đổi mật khẩu của tôi');
  await fillPasswords(user, { current: true }); await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
  await waitFor(() => expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue(''));
  const change = fetch.mock.calls.find(([url]) => url.endsWith('/auth/me/password'));
  expect(change[1].method).toBe('PATCH'); expect(JSON.parse(change[1].body)).toEqual({ currentPassword: 'ExistingPassword123!', newPassword });
  await request('/auth/me');
  expect(fetch.mock.lastCall[1].headers.get('Authorization')).toBe('Bearer rotated-token');
  expect(screen.getByText('Đổi mật khẩu của tôi')).toBeInTheDocument();
});

it('does not show the admin password form on student profiles', async () => {
  setAccessToken('student-token'); fetch.mockResolvedValue(response({ data: { ...admin, role: 'student', fullName: 'Sinh viên' } }));
  render(<AuthProvider><ToastProvider><Ready><ProfilePage /></Ready></ToastProvider></AuthProvider>);
  await screen.findByText('Hồ sơ cá nhân');
  expect(screen.queryByLabelText('Mật khẩu mới')).not.toBeInTheDocument();
});

it('shows reset actions only for students and teachers and submits the selected account', async () => {
  setAccessToken('admin-token');
  const people = [admin, { _id: 'teacher-id', fullName: 'Giảng viên An', email: 'teacher@example.com', role: 'teacher', isActive: true }, { _id: 'student-id', fullName: 'Sinh viên Bình', email: 'student@example.com', role: 'student', isActive: true }];
  fetch.mockImplementation(async url => {
    if (url.endsWith('/auth/me')) return response({ data: admin });
    if (url.endsWith('/password')) return response({ data: people[1] });
    return response({ data: people, pagination: { page: 1, totalPages: 1, total: 3 } });
  });
  const user = userEvent.setup();
  render(<AuthProvider><ToastProvider><Ready><UsersPage /></Ready></ToastProvider></AuthProvider>);
  const actions = await screen.findAllByRole('button', { name: 'Đặt lại mật khẩu' });
  expect(actions).toHaveLength(2);
  await user.click(actions[0]); await fillPasswords(user);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent('Giảng viên An');
  await user.click(dialog.querySelector('button[type="submit"]'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const change = fetch.mock.calls.find(([url]) => url.endsWith('/users/teacher-id/password'));
  expect(change[1].method).toBe('PATCH'); expect(JSON.parse(change[1].body)).toEqual({ newPassword });
});
