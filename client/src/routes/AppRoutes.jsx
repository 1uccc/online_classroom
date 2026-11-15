import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Empty, Loading } from '../components/common/UI';
import CatalogPage from '../pages/CatalogPage';
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AuthPage = lazy(() => import('../pages/AuthPage'));
const CoursePage = lazy(() => import('../pages/CoursePage'));
const AssignmentPage = lazy(() => import('../pages/AssignmentPage'));
const LearningPage = lazy(() => import('../pages/LearningPage'));
const TeachingPage = lazy(() => import('../pages/TeachingPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const CategoriesPage = lazy(() => import('../pages/admin/CategoriesPage'));

function Home() { const { user } = useAuth(); return user ? <DashboardPage /> : <CatalogPage />; }
export function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <Loading label="Đang mở không gian học tập…" />;
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/login" element={<AuthPage key="login" />} /><Route path="/register" element={<AuthPage key="register" register />} />
    <Route element={<AppLayout />}><Route index element={<Home />} /><Route path="courses" element={<CatalogPage />} /><Route path="courses/:courseId" element={<CoursePage />} />
      <Route element={<ProtectedRoute />}><Route path="profile" element={<ProfilePage />} /></Route>
      <Route element={<ProtectedRoute roles={['student']} />}><Route path="my-learning" element={<LearningPage />} /></Route>
      <Route element={<ProtectedRoute roles={['teacher']} />}><Route path="teaching" element={<TeachingPage />} /></Route>
      <Route element={<ProtectedRoute roles={['teacher', 'student']} />}><Route path="courses/:courseId/assignments/:assignmentId" element={<AssignmentPage />} /></Route>
      <Route element={<ProtectedRoute roles={['admin']} />}><Route path="admin/users" element={<UsersPage />} /><Route path="admin/categories" element={<CategoriesPage />} /></Route>
      <Route path="*" element={<Empty title="Trang này không tồn tại" description="Bạn có thể quay lại để tiếp tục khám phá."><Link to="/" className="btn btn-primary">Về trang chủ</Link></Empty>} />
    </Route>
  </Routes></Suspense>;
}
