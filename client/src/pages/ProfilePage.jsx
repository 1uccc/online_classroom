import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '../hooks/useMutation';
import { Button, ErrorNotice, Field, PageHeading } from '../components/common/UI';
import { PasswordForm } from '../components/common/PasswordForm';
import { initials, roleLabels } from '../utils/format';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [name, setName] = useState(user.fullName);
  const mutation = useMutation();
  return <><PageHeading eyebrow="TÀI KHOẢN CỦA BẠN" title="Hồ sơ cá nhân" description="Một chút thông tin để mọi người biết đến bạn." /><section className="panel profile-panel"><div className="profile-intro"><span className="avatar avatar-large">{initials(user.fullName)}</span><div><h2>{user.fullName}</h2><p className="muted">{roleLabels[user.role]}</p></div></div><ErrorNotice error={mutation.error} />
    <form className="form-stack" onSubmit={event => { event.preventDefault(); mutation.run(() => updateProfile({ fullName: name }), 'Đã cập nhật hồ sơ.'); }}><Field label="Họ và tên"><input value={name} onChange={event => setName(event.target.value)} required maxLength={120} autoComplete="name" /></Field><Field label="Địa chỉ email"><input value={user.email} readOnly /></Field><Field label="Vai trò"><input value={roleLabels[user.role]} readOnly /></Field><div><Button type="submit" busy={mutation.busy}><UserRound size={16} />Lưu thay đổi</Button></div></form>
  </section>{user.role === 'admin' ? <section className="panel profile-panel"><div className="section-heading"><div><h2>Đổi mật khẩu của tôi</h2><p className="muted">Xác nhận mật khẩu hiện tại để cập nhật mật khẩu Admin.</p></div></div><PasswordForm requireCurrent onSubmit={changePassword} /></section> : null}</>;
}
