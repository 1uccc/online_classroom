import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import UsersPage from '../pages/admin/UsersPage';
import { setAccessToken } from '../api/httpClient';

const admin = { _id: 'admin-id', role: 'admin', fullName: 'Quản trị viên', email: 'admin@example.com', isActive: true };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let people;
let rejectDuplicate;
beforeEach(() => {
  setAccessToken('admin-token'); rejectDuplicate = false;
  people = [admin, { _id: 'teacher-id', fullName: 'Giảng viên An', email: 'teacher@example.com', role: 'teacher', isActive: true }, { _id: 'student-id', fullName: 'Sinh viên Bình', email: 'student@example.com', role: 'student', isActive: false }];
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    if (url.endsWith('/auth/me')) return response({ data: admin });
    if (options.method === 'PATCH') {
      if (rejectDuplicate) return response({ message: 'Email này đã được sử dụng bởi tài khoản khác.', code: 'EMAIL_ALREADY_EXISTS' }, 409);
      const id = url.split('/').at(-1);
      people = people.map(person => person._id === id ? { ...person, ...JSON.parse(options.body) } : person);
      return response({ data: people.find(person => person._id === id) });
    }
    if (options.method === 'POST') {
      const { password, ...profile } = JSON.parse(options.body);
      const created = { ...profile, _id: 'created-id', isActive: true }; people = [...people, created];
      return response({ data: created }, 201);
    }
    return response({ data: people, pagination: { page: 1, totalPages: 1, total: people.length } });
  }));
});
function Ready() { const { user } = useAuth(); return user ? <UsersPage /> : <p>Đang xác thực</p>; }
function renderUsers() { return render(<AuthProvider><ToastProvider><Ready /></ToastProvider></AuthProvider>); }

it.each(['teacher', 'student'])('edits a %s profile and refreshes the list with the server data', async role => {
  const user = userEvent.setup(); renderUsers();
  const person = people.find(person => person.role === role);
  const row = (await screen.findByText(person.fullName)).closest('tr');
  await user.click(within(row).getByRole('button', { name: 'Sửa hồ sơ' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByLabelText('Họ và tên')).toHaveValue(person.fullName);
  expect(within(dialog).getByLabelText('Vai trò')).toHaveProperty('readOnly', true);
  expect(within(dialog).getByLabelText('Trạng thái')).toHaveProperty('readOnly', true);
  const name = within(dialog).getByLabelText('Họ và tên'); const email = within(dialog).getByLabelText('Email');
  await user.clear(name); await user.type(name, 'Hồ sơ đã cập nhật');
  await user.clear(email); await user.type(email, `UPDATED-${role.toUpperCase()}@EXAMPLE.COM`);
  await user.click(within(dialog).getByRole('button', { name: 'Lưu hồ sơ' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(await screen.findByText(`updated-${role}@example.com`)).toBeInTheDocument();
  const update = fetch.mock.calls.find(([, options]) => options.method === 'PATCH');
  expect(update[0]).toBe(`/api/v1/users/${person._id}`);
  expect(JSON.parse(update[1].body)).toEqual({ fullName: 'Hồ sơ đã cập nhật', email: `updated-${role}@example.com` });
  expect(people.find(item => item._id === person._id).isActive).toBe(person.isActive);
});

it('only shows profile editing for student and teacher accounts', async () => {
  renderUsers();
  expect(await screen.findAllByRole('button', { name: 'Sửa hồ sơ' })).toHaveLength(2);
  const row = screen.getByText('Quản trị viên (bạn)').closest('tr');
  expect(within(row).queryByRole('button', { name: 'Sửa hồ sơ' })).not.toBeInTheDocument();
});

it('keeps the edited profile open when the server rejects a duplicate email', async () => {
  rejectDuplicate = true; const user = userEvent.setup(); renderUsers();
  const row = (await screen.findByText('Giảng viên An')).closest('tr');
  await user.click(within(row).getByRole('button', { name: 'Sửa hồ sơ' }));
  const email = screen.getByLabelText('Email');
  await user.clear(email); await user.type(email, 'student@example.com');
  await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email này đã được sử dụng');
  expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(email).toHaveValue('student@example.com');
  expect(people.find(person => person._id === 'teacher-id').email).toBe('teacher@example.com');
});

it('closes without a request when no profile field changed', async () => {
  const user = userEvent.setup(); renderUsers();
  const row = (await screen.findByText('Giảng viên An')).closest('tr');
  await user.click(within(row).getByRole('button', { name: 'Sửa hồ sơ' }));
  await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === 'PATCH')).toBe(false);
});

it('still creates new student accounts with the create form', async () => {
  const user = userEvent.setup(); renderUsers(); await screen.findByText('Giảng viên An');
  await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
  const dialog = screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Họ và tên'), 'Sinh viên mới');
  await user.type(within(dialog).getByLabelText('Email'), 'NEW@example.com');
  await user.type(within(dialog).getByLabelText(/Mật khẩu ban đầu/), 'CreateStudentPassword123!');
  await user.selectOptions(within(dialog).getByLabelText('Vai trò'), 'student');
  await user.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }));
  expect(await screen.findByText('new@example.com')).toBeInTheDocument();
  const created = fetch.mock.calls.find(([, options]) => options.method === 'POST');
  expect(JSON.parse(created[1].body)).toEqual({ fullName: 'Sinh viên mới', email: 'new@example.com', role: 'student', password: 'CreateStudentPassword123!' });
});
