import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useMutation } from '../../hooks/useMutation';
import { passwordValid } from '../../utils/format';
import { Button, ErrorNotice, Field } from './UI';

export function PasswordForm({ requireCurrent = false, onSubmit, onSuccess, onCancel }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validation, setValidation] = useState(null);
  const mutation = useMutation();

  async function submit(event) {
    event.preventDefault(); setValidation(null);
    if (!passwordValid(newPassword)) return setValidation(new Error('Mật khẩu mới cần ít nhất 12 ký tự và không vượt quá 72 byte UTF-8.'));
    if (newPassword !== confirmation) return setValidation(new Error('Xác nhận mật khẩu không khớp.'));
    if (requireCurrent && currentPassword === newPassword) return setValidation(new Error('Mật khẩu mới phải khác mật khẩu hiện tại.'));
    const result = await mutation.run(() => onSubmit({ newPassword, ...(requireCurrent && { currentPassword }) }),
      requireCurrent ? 'Đã đổi mật khẩu. Các phiên đăng nhập cũ đã kết thúc.' : 'Đã đặt lại mật khẩu. Người dùng cần đăng nhập lại bằng mật khẩu mới.');
    if (result.ok) {
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      onSuccess?.();
    }
  }

  return <form className="form-stack" onSubmit={submit}><ErrorNotice error={validation || mutation.error} />
    {requireCurrent ? <Field label="Mật khẩu hiện tại"><input aria-label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></Field> : null}
    <Field label="Mật khẩu mới" hint="Ít nhất 12 ký tự, tối đa 72 byte UTF-8."><input aria-label="Mật khẩu mới" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></Field>
    <Field label="Xác nhận mật khẩu mới"><input aria-label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></Field>
    <p className="form-hint">{requireCurrent ? 'Bạn sẽ tiếp tục dùng phiên hiện tại sau khi đổi. Các phiên đăng nhập trước đó sẽ hết hiệu lực.' : 'Các phiên đăng nhập cũ của tài khoản này sẽ hết hiệu lực. Mật khẩu không được gửi qua email tự động.'}</p>
    <div className="form-actions">{onCancel ? <Button variant="secondary" disabled={mutation.busy} onClick={onCancel}>Hủy</Button> : null}<Button type="submit" busy={mutation.busy}><KeyRound size={16} />{requireCurrent ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu'}</Button></div>
  </form>;
}
