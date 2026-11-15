import { useCallback, useState } from 'react';
import { KeyRound, LockKeyhole, Plus, Search, UnlockKeyhole } from 'lucide-react';
import { request } from '../../api/httpClient';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../contexts/AuthContext';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { passwordValid, roleLabels, initials } from '../../utils/format';
import { Button, ConfirmButton, Empty, ErrorNotice, Field, Loading, Modal, PageHeading, Pagination } from '../../components/common/UI';
import { PasswordForm } from '../../components/common/PasswordForm';

function UserEditor({ onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'teacher' });
  const mutation = useMutation();
  const [validationError, setValidationError] = useState(null);
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setValidationError(null);
    if (!passwordValid(form.password)) return setValidationError(new Error('Mật khẩu cần ít nhất 12 ký tự và không quá 72 byte UTF-8.'));
    const result = await mutation.run(() => adminApi.createUser({ ...form, email: form.email.trim().toLowerCase() }), 'Đã tạo tài khoản.');
    if (result.ok) onSaved();
  }
  return <Modal title="Tạo tài khoản mới" onClose={onClose}><ErrorNotice error={validationError || mutation.error} /><form className="form-stack" onSubmit={submit}>
    <Field label="Họ và tên"><input autoFocus name="fullName" autoComplete="off" required maxLength={120} value={form.fullName} onChange={update} /></Field>
    <Field label="Email"><input name="email" type="email" autoComplete="off" required maxLength={254} value={form.email} onChange={update} /></Field>
    <Field label="Mật khẩu ban đầu" hint="Ít nhất 12 ký tự; cung cấp trực tiếp cho chủ tài khoản."><input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={form.password} onChange={update} /></Field>
    <Field label="Vai trò"><select name="role" value={form.role} onChange={update}><option value="teacher">Giảng viên</option><option value="student">Sinh viên</option></select></Field>
    <div className="form-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" busy={mutation.busy}>Tạo tài khoản</Button></div>
  </form></Modal>;
}
export default function UsersPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState({ page: 1, search: '', role: '', isActive: '' });
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const resource = useResource(useCallback(signal => request('/users', { signal, query: { ...query, limit: 10 } }), [query]));
  const mutation = useMutation();
  async function toggle(person) {
    const result = await mutation.run(() => adminApi.userStatus(person._id, !person.isActive), person.isActive ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    if (result.ok) resource.reload();
    return result.ok;
  }
  return <><PageHeading eyebrow="QUẢN TRỊ HỆ THỐNG" title="Quản lý người dùng" description="Quản lý tài khoản và quyền truy cập của cộng đồng học tập."><Button onClick={() => setEditor(true)}><Plus size={17} />Tạo tài khoản</Button></PageHeading>
    <form className="filter-bar" onSubmit={event => { event.preventDefault(); setQuery(value => ({ ...value, search: search.trim(), page: 1 })); }}><div className="search-input"><Search size={18} /><input aria-label="Tìm người dùng" placeholder="Tìm theo tên hoặc email…" value={search} onChange={event => setSearch(event.target.value)} /><Button type="submit" variant="secondary">Tìm</Button></div>
      <select aria-label="Lọc vai trò" value={query.role} onChange={event => setQuery(value => ({ ...value, role: event.target.value, page: 1 }))}><option value="">Tất cả vai trò</option>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      <select aria-label="Lọc trạng thái tài khoản" value={query.isActive} onChange={event => setQuery(value => ({ ...value, isActive: event.target.value, page: 1 }))}><option value="">Tất cả trạng thái</option><option value="true">Hoạt động</option><option value="false">Đã khóa</option></select>
    </form><ErrorNotice error={mutation.error} />{resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty title="Chưa tìm thấy người dùng" description="Thử đổi từ khóa hoặc điều kiện lọc." /> : <div className="table-wrap"><table><thead><tr><th>Thành viên</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.data.map(person => <tr key={person._id}><td><div className="person-cell"><span className="avatar avatar-light">{initials(person.fullName)}</span><span><strong>{person.fullName}{person._id === user._id ? ' (bạn)' : ''}</strong><small>{person.email}</small></span></div></td><td>{roleLabels[person.role]}</td><td><span className={`badge badge-${person.isActive ? 'active' : 'cancelled'}`}>{person.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td><td><div className="row-actions"><ConfirmButton disabled={person._id === user._id || mutation.busy} variant={person.isActive ? 'danger' : 'secondary'} title={person.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'} description={person.isActive ? `${person.fullName} sẽ không thể đăng nhập hoặc tiếp tục phiên hiện tại.` : `${person.fullName} sẽ được truy cập hệ thống trở lại.`} onConfirm={() => toggle(person)}>{person.isActive ? <LockKeyhole size={15} /> : <UnlockKeyhole size={15} />}{person.isActive ? 'Khóa' : 'Mở khóa'}</ConfirmButton>{['student', 'teacher'].includes(person.role) ? <Button variant="secondary" disabled={mutation.busy} onClick={() => setPasswordUser(person)}><KeyRound size={15} />Đặt lại mật khẩu</Button> : null}</div></td></tr>)}</tbody></table></div>}
    <Pagination pagination={resource.data?.pagination} onChange={page => setQuery(value => ({ ...value, page }))} />{editor ? <UserEditor onClose={() => setEditor(false)} onSaved={() => { setEditor(false); resource.reload(); }} /> : null}
    {passwordUser ? <Modal title="Đặt lại mật khẩu người dùng" onClose={() => setPasswordUser(null)}><p className="muted mb-5">Tài khoản: <strong>{passwordUser.fullName}</strong> · {passwordUser.email}</p><PasswordForm onSubmit={({ newPassword }) => adminApi.resetPassword(passwordUser._id, newPassword)} onSuccess={() => setPasswordUser(null)} onCancel={() => setPasswordUser(null)} /></Modal> : null}
  </>;
}
