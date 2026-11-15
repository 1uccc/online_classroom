import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, GraduationCap, Pencil, Users } from 'lucide-react';
import { request, allPages } from '../api/httpClient';
import { courseApi } from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { useMutation } from '../hooks/useMutation';
import { idOf } from '../utils/format';
import { CourseEditor } from '../components/courses/CourseEditor';
import { MaterialsPanel } from '../components/courses/MaterialsPanel';
import { StudentsPanel } from '../components/courses/StudentsPanel';
import { AssignmentsPanel } from '../components/assignments/AssignmentsPanel';
import { Badge, Button, ConfirmButton, ErrorNotice, Loading } from '../components/common/UI';

export default function CoursePage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('materials');
  const [editor, setEditor] = useState(false);
  const resource = useResource(useCallback(async signal => {
    const [course, enrollments] = await Promise.all([
      request(`/courses/${courseId}`, { signal }), user?.role === 'student' ? allPages('/enrollments/me', { signal }) : Promise.resolve([]),
    ]);
    return { course: course.data, enrollment: enrollments.find(e => idOf(e.course) === courseId) };
  }, [courseId, user?.role]));
  const mutation = useMutation();
  if (resource.loading) return <Loading />;
  if (resource.error) return <><Link to="/courses" className="back-link"><ArrowLeft size={17} />Danh sách khóa học</Link><ErrorNotice error={resource.error} retry={resource.reload} /></>;
  const { course, enrollment } = resource.data;
  const teacher = user?.role === 'teacher' && idOf(course.teacher) === user._id;
  const enrolled = user?.role === 'student' && ['active', 'completed'].includes(enrollment?.status);
  const access = teacher || enrolled;
  async function changeStatus(status) {
    const result = await mutation.run(() => courseApi.status(courseId, status), 'Đã cập nhật trạng thái khóa học.');
    if (result.ok) resource.reload();
    return result.ok;
  }
  async function enroll() {
    const result = await mutation.run(() => courseApi.enroll(courseId), 'Ghi danh thành công. Chào mừng bạn đến với lớp!');
    if (result.ok) resource.reload();
  }
  async function cancel() {
    const result = await mutation.run(() => courseApi.cancel(courseId), 'Đã hủy ghi danh.');
    if (result.ok) resource.reload();
    return result.ok;
  }
  return <><Link to={teacher ? '/teaching' : '/courses'} className="back-link"><ArrowLeft size={17} />{teacher ? 'Lớp học giảng dạy' : 'Danh sách khóa học'}</Link><section className="course-hero"><div><span className="eyebrow">KHÔNG GIAN LỚP HỌC</span><h1>{course.title}</h1><div className="flex flex-wrap items-center gap-2"><Badge status={course.status} />{enrollment ? <Badge status={enrollment.status} /> : null}</div><p className="prose-text">{course.description}</p></div><div className="course-hero-icon" aria-hidden="true"><BookOpen size={70} strokeWidth={1.2} /></div></section><ErrorNotice error={mutation.error} />
    {teacher ? <div className="course-toolbar"><span className="muted">Quản lý khóa học</span><div className="row-actions"><Button variant="secondary" onClick={() => setEditor(true)}><Pencil size={15} />Chỉnh sửa</Button>{course.status !== 'published' ? <Button busy={mutation.busy} onClick={() => changeStatus('published')}>Xuất bản khóa học</Button> : null}{course.status === 'published' ? <ConfirmButton variant="secondary" title="Lưu trữ khóa học?" description="Sinh viên đã ghi danh vẫn xem được nội dung. Khóa học dừng nhận ghi danh và bài nộp mới." onConfirm={() => changeStatus('archived')}>Lưu trữ</ConfirmButton> : null}</div></div> : null}
    {!access ? <section className="enrollment-callout"><span className="empty-icon"><GraduationCap size={30} /></span><div><h2>Sẵn sàng bắt đầu học?</h2><p className="muted">Ghi danh để truy cập tài liệu, làm bài tập và nhận phản hồi từ giảng viên.</p></div>{!user ? <Link to="/login" state={{ from: `/courses/${courseId}` }} className="btn btn-primary">Đăng nhập để ghi danh<ArrowRight size={17} /></Link> : user.role === 'student' && course.status === 'published' ? <Button busy={mutation.busy} onClick={enroll}>{enrollment?.status === 'cancelled' ? 'Ghi danh lại' : 'Ghi danh khóa học'}<ArrowRight size={17} /></Button> : <p className="muted">{user.role === 'student' ? 'Khóa học hiện không nhận ghi danh.' : 'Nội dung dành cho sinh viên ghi danh và giảng viên sở hữu.'}</p>}</section> : <>
      {course.status === 'archived' ? <div className="notice">Khóa học đã được lưu trữ. Sinh viên vẫn xem được tài liệu và điểm, nhưng không thể nộp thêm bài.</div> : null}
      <nav className="workspace-tabs" aria-label="Nội dung lớp học">{[{ id: 'materials', label: 'Tài liệu', icon: BookOpen }, { id: 'assignments', label: 'Bài tập', icon: ClipboardList }, ...(teacher ? [{ id: 'students', label: 'Sinh viên', icon: Users }] : [])].map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><Icon size={18} />{label}</button>)}</nav>
      <div className="workspace-content">{tab === 'materials' ? <MaterialsPanel key={courseId} courseId={courseId} teacher={teacher} /> : tab === 'assignments' ? <AssignmentsPanel key={courseId} courseId={courseId} teacher={teacher} /> : teacher ? <StudentsPanel key={courseId} courseId={courseId} /> : null}</div>
      {enrolled ? <div className="enrollment-footer"><span className="muted">Bạn đã ghi danh khóa học này.</span><ConfirmButton variant="ghost" title="Hủy ghi danh khóa học?" description="Bạn sẽ mất quyền truy cập tài liệu. Bài nộp và điểm đã có vẫn được giữ lại." onConfirm={cancel}>Hủy ghi danh</ConfirmButton></div> : null}
    </>}{editor ? <CourseEditor course={course} onClose={() => setEditor(false)} onSaved={() => { setEditor(false); resource.reload(); }} /> : null}
  </>;
}
