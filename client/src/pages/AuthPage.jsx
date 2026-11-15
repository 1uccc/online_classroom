import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/authApi';
import { Button, ErrorNotice, Field } from '../components/common/UI';
import { passwordValid } from '../utils/format';

export default function AuthPage({ register = false }) {
  const { user, login, sessionError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();
  if (user) return <Navigate to="/" replace />;
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError(null);
    if (register && !passwordValid(form.password)) return setError(new Error('Mật khẩu cần ít nhất 12 ký tự và không vượt 72 byte UTF-8.'));
    setBusy(true);
    try {
      if (register) await authApi.register({ ...form, email: form.email.trim().toLowerCase() });
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/', { replace: true });
    } catch (error) { setError(error); }
    finally { setBusy(false); }
  }
  return <div className="auth-layout"><section className="auth-story"><Link className="brand" to="/"><span className="brand-icon"><BookOpen size={25} /></span><span>classroom<span className="brand-dot">.</span></span></Link>
    <div className="auth-story-body"><span className="auth-kicker">KHÔNG GIAN CHO TRI THỨC</span><h1>Kiến thức mới.<br />Khả năng mới.<br /><span>Phiên bản mới của bạn.</span></h1><p>Kết nối với giảng viên, khám phá bài học và theo dõi hành trình học tập — trong một không gian.</p>
      <div className="auth-benefits">{['Tài liệu học tập luôn trong tầm tay', 'Nộp bài và nhận phản hồi trực tiếp', 'Một nơi kết nối cả lớp học'].map(text => <span key={text}><Check size={17} />{text}</span>)}</div>
    </div><div className="auth-bottom"><GraduationCap size={24} /><span>Cùng nhau học tập. Cùng nhau tiến bộ.</span></div><div className="auth-decoration" aria-hidden="true"><BookOpen size={210} strokeWidth={0.7} /></div>
  </section><section className="auth-panel"><Link to="/courses" className="back-link"><ArrowLeft size={17} />Về danh sách khóa học</Link><div className="auth-form-container"><span className="eyebrow">{register ? 'BẮT ĐẦU HÀNH TRÌNH' : 'CHÀO MỪNG TRỞ LẠI'}</span><h2>{register ? 'Tạo tài khoản của bạn' : 'Đăng nhập Classroom'}</h2><p className="muted">{register ? 'Tài khoản mới dành cho sinh viên. Cùng bắt đầu học nhé.' : 'Tiếp tục những bài học và dự định còn dang dở.'}</p>
    <ErrorNotice error={error || (!register && sessionError)} /><form onSubmit={submit} className="form-stack">
      {register ? <Field label="Họ và tên"><input name="fullName" autoComplete="name" required maxLength={120} value={form.fullName} onChange={update} placeholder="Nguyễn Văn An" /></Field> : null}
      <Field label="Địa chỉ email"><input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update} placeholder="ban@example.com" /></Field>
      <Field label="Mật khẩu" hint={register ? 'Ít nhất 12 ký tự, tối đa 72 byte UTF-8.' : undefined}><span className="password-input"><input name="password" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={128} value={form.password} onChange={update} placeholder="Nhập mật khẩu của bạn" /><button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></Field>
      <Button type="submit" busy={busy} className="w-full">{register ? 'Tạo tài khoản và đăng nhập' : 'Đăng nhập'}<ArrowRight size={17} /></Button>
    </form><p className="auth-switch">{register ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'} <Link to={register ? '/login' : '/register'}>{register ? 'Đăng nhập' : 'Đăng ký ngay'}</Link></p>
  </div><p className="auth-copyright">Classroom · Học theo cách của bạn.</p></section></div>;
}
