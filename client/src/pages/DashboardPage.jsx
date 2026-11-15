import { useCallback } from 'react';
import { ArrowRight, BookOpen, GraduationCap, Shapes, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { request, allPages } from '../api/httpClient';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { CourseCard } from '../components/courses/CourseCard';
import { Empty, ErrorNotice, Loading, PageHeading } from '../components/common/UI';
import { roleLabels } from '../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const resource = useResource(useCallback(async signal => {
    if (user.role === 'admin') {
      const [users, teachers, students, categories] = await Promise.all([
        request('/users', { signal, query: { limit: 5 } }), request('/users', { signal, query: { limit: 1, role: 'teacher' } }),
        request('/users', { signal, query: { limit: 1, role: 'student' } }), request('/categories', { signal, query: { includeInactive: true, limit: 1 } }),
      ]);
      return { users, stats: [users.pagination.total, teachers.pagination.total, students.pagination.total, categories.pagination.total] };
    }
    if (user.role === 'teacher') {
      const courses = await allPages('/courses/mine', { signal });
      return { courses, stats: [courses.length, courses.filter(c => c.status === 'published').length, courses.filter(c => c.status === 'draft').length] };
    }
    const enrollments = await allPages('/enrollments/me', { signal });
    return { enrollments, stats: [enrollments.filter(e => e.status === 'active').length, enrollments.filter(e => e.status === 'completed').length, enrollments.length] };
  }, [user.role]));
  const stats = user.role === 'admin' ? [{ label: 'Tổng người dùng', icon: Users }, { label: 'Giảng viên', icon: BookOpen }, { label: 'Sinh viên', icon: GraduationCap }, { label: 'Danh mục', icon: Shapes }] : user.role === 'teacher' ? [{ label: 'Lớp học của bạn', icon: BookOpen }, { label: 'Đang xuất bản', icon: GraduationCap }, { label: 'Bản nháp', icon: Shapes }] : [{ label: 'Lớp đang học', icon: BookOpen }, { label: 'Đã hoàn thành', icon: GraduationCap }, { label: 'Tổng lượt ghi danh', icon: Shapes }];
  const courses = resource.data?.courses || resource.data?.enrollments?.filter(e => ['active', 'completed'].includes(e.status)).map(e => ({ ...e.course, enrollment: e })) || [];
  const destination = user.role === 'admin' ? '/admin/users' : user.role === 'teacher' ? '/teaching' : '/my-learning';
  return <><PageHeading eyebrow={`KHÔNG GIAN ${roleLabels[user.role].toLocaleUpperCase('vi-VN')}`} title={`Chào ${user.fullName.split(' ').at(-1)}, rất vui gặp bạn!`} description="Một ngày mới, một cơ hội để học hỏi và tiến bộ." />
    <section className="welcome-banner"><div><span className="welcome-tag"><Sparkles size={14} />HÀNH TRÌNH CỦA BẠN</span><h2>{user.role === 'teacher' ? <>Truyền cảm hứng hôm nay.<br />Mở lối cho ngày mai.</> : user.role === 'admin' ? <>Kết nối con người.<br />Nuôi dưỡng tri thức.</> : <>Mỗi ngày,<br />một điều mới.</>}</h2><p>{user.role === 'teacher' ? 'Chuẩn bị bài giảng, kết nối với sinh viên và ghi nhận từng tiến bộ.' : user.role === 'admin' ? 'Chăm sóc cộng đồng học tập từ những điều nhỏ nhất.' : 'Tiếp tục lớp học của bạn và biến sự tò mò thành kiến thức.'}</p><Link to={destination} className="btn btn-dark">{user.role === 'admin' ? 'Quản lý người dùng' : user.role === 'teacher' ? 'Đến lớp học giảng dạy' : 'Tiếp tục học tập'}<ArrowRight size={17} /></Link></div><div className="welcome-art" aria-hidden="true"><span className="welcome-ring" /><span className="welcome-sheet sheet-back" /><span className="welcome-sheet sheet-front"><BookOpen size={74} strokeWidth={1.2} /><i /><i /><i /></span><span className="welcome-star">✦</span><span className="welcome-circle" /></div></section>
    <div className={`stats-grid ${stats.length === 4 ? 'stats-four' : ''}`}>{stats.map(({ label, icon: Icon }, index) => <div className="stat-card" key={label}><span className={`stat-icon stat-${index}`}><Icon size={23} strokeWidth={1.6} /></span><div><strong>{resource.data?.stats[index] ?? '—'}</strong><span>{label}</span></div></div>)}</div>
    <div className="section-heading"><h2>{user.role === 'admin' ? 'Thành viên mới nhất' : 'Không gian lớp học của bạn'}</h2><Link to={destination} className="text-link">Xem tất cả<ArrowRight size={16} /></Link></div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : user.role === 'admin' ? <div className="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>{resource.data.users.data.map(person => <tr key={person._id}><td><strong>{person.fullName}</strong></td><td>{person.email}</td><td>{roleLabels[person.role]}</td><td><span className={`badge badge-${person.isActive ? 'active' : 'cancelled'}`}>{person.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td></tr>)}</tbody></table></div> : courses.length ? <div className="course-grid">{courses.slice(0, 3).map(course => <CourseCard key={course._id} course={course} enrollment={course.enrollment} />)}</div> : <Empty title={user.role === 'teacher' ? 'Lớp học đầu tiên đang chờ bạn' : 'Bắt đầu với một lớp học'} description={user.role === 'teacher' ? 'Tạo lớp học và chia sẻ những điều bạn biết.' : 'Khám phá khóa học, ghi danh và học theo nhịp độ của bạn.'}><Link className="btn btn-primary" to={user.role === 'teacher' ? '/teaching' : '/courses'}>{user.role === 'teacher' ? 'Tạo lớp học' : 'Khám phá ngay'}<ArrowRight size={16} /></Link></Empty>}
  </>;
}
