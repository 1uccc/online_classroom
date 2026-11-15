import { useState } from 'react';
import { BookOpen, Compass, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, Shapes, Users, UserRound, X, ArrowUpRight } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { initials, roleLabels } from '../utils/format';

const studentLinks = [{ to: '/', label: 'Tổng quan', icon: LayoutDashboard }, { to: '/my-learning', label: 'Lớp học của tôi', icon: GraduationCap }, { to: '/courses', label: 'Khám phá khóa học', icon: Compass }];
const teacherLinks = [{ to: '/', label: 'Tổng quan', icon: LayoutDashboard }, { to: '/teaching', label: 'Lớp học giảng dạy', icon: BookOpen }, { to: '/courses', label: 'Khám phá khóa học', icon: Compass }];
const adminLinks = [{ to: '/', label: 'Tổng quan', icon: LayoutDashboard }, { to: '/admin/users', label: 'Người dùng', icon: Users }, { to: '/admin/categories', label: 'Danh mục khóa học', icon: Shapes }, { to: '/courses', label: 'Khám phá khóa học', icon: Compass }];
const guestLinks = [{ to: '/courses', label: 'Khám phá khóa học', icon: Compass }];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const links = user ? ({ student: studentLinks, teacher: teacherLinks, admin: adminLinks }[user.role] || guestLinks) : guestLinks;
  const title = links.find(item => item.to === location.pathname)?.label || (location.pathname === '/profile' ? 'Hồ sơ cá nhân' : 'Không gian lớp học');
  return <div className="app-shell">
    {menu ? <button className="sidebar-scrim" aria-label="Đóng menu" onClick={() => setMenu(false)} /> : null}
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
      <Link className="brand" to="/" onClick={() => setMenu(false)}><span className="brand-icon"><BookOpen size={25} /></span><span>classroom<span className="brand-dot">.</span><small>HỌC TẬP · KẾT NỐI · PHÁT TRIỂN</small></span></Link>
      <div className="sidebar-section">KHÔNG GIAN CỦA BẠN</div>
      <nav aria-label="Điều hướng chính">{links.map(({ to, label, icon: Icon }) => <NavLink end to={to} key={to} onClick={() => setMenu(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={20} strokeWidth={1.7} />{label}</NavLink>)}</nav>
      <div className="sidebar-note"><span className="sidebar-note-icon"><GraduationCap size={27} /></span><h3>Mỗi ngày, tiến xa hơn.</h3><p>Một nơi cho những kiến thức mới và những kết nối ý nghĩa.</p>
        <Link to={user?.role === 'teacher' ? '/teaching' : '/courses'} onClick={() => setMenu(false)}>{user?.role === 'teacher' ? 'Quản lý lớp học' : 'Tìm lớp học phù hợp'}<ArrowUpRight size={16} /></Link>
      </div>
      <div className="sidebar-bottom">{user ? <><Link to="/profile" className="sidebar-user" onClick={() => setMenu(false)}><span className="avatar">{initials(user.fullName)}</span><span><strong>{user.fullName}</strong><small>{roleLabels[user.role]}</small></span></Link><button className="logout-button" onClick={() => { logout(); setMenu(false); }}><LogOut size={17} />Đăng xuất</button></> : <Link to="/login" className="btn btn-sidebar">Đăng nhập<ArrowUpRight size={17} /></Link>}</div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="flex items-center gap-3"><button className="icon-btn mobile-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Đóng menu' : 'Mở menu'}>{menu ? <X size={22} /> : <Menu size={22} />}</button><span className="topbar-breadcrumb">Không gian học tập<span>/</span><strong>{title}</strong></span></div>
      <div className="topbar-right"><span className="connection-label"><i />Cùng nhau học tốt hơn</span>{user ? <Link to="/profile" className="avatar avatar-light" aria-label="Mở hồ sơ cá nhân">{initials(user.fullName)}</Link> : <Link to="/login" className="btn btn-secondary"><UserRound size={16} />Đăng nhập</Link>}</div>
    </header><main id="main-content" className="page-content"><Outlet /></main><footer className="page-footer"><span>Classroom · Không gian cho tri thức</span><span>Học theo cách của bạn.</span></footer></div>
    <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
  </div>;
}
