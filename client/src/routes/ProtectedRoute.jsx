import { Navigate, Outlet, useLocation } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Empty, Loading } from '../components/common/UI';
import { Link } from 'react-router';

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Đang xác thực phiên đăng nhập…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (roles && !roles.includes(user.role)) return <Empty icon={ShieldAlert} title="Bạn không có quyền truy cập" description="Trang này dành cho một vai trò khác trong hệ thống."><Link to="/" className="btn btn-primary">Về tổng quan</Link></Empty>;
  return <Outlet />;
}
