import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, ClipboardList, Pencil, Trophy } from 'lucide-react';
import { request, allPages } from '../api/httpClient';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { dateTime, idOf } from '../utils/format';
import { AssignmentEditor } from '../components/assignments/AssignmentEditor';
import { StudentSubmission } from '../components/assignments/StudentSubmission';
import { TeacherSubmissions } from '../components/assignments/TeacherSubmissions';
import { Badge, Button, ErrorNotice, Loading, PageHeading } from '../components/common/UI';

export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const { user } = useAuth();
  const [editor, setEditor] = useState(false);
  const resource = useResource(useCallback(async signal => {
    const [course, assignment, enrollments] = await Promise.all([
      request(`/courses/${courseId}`, { signal }), request(`/courses/${courseId}/assignments/${assignmentId}`, { signal }),
      user.role === 'student' ? allPages('/enrollments/me', { signal }) : Promise.resolve([]),
    ]);
    return { course: course.data, assignment: assignment.data, enrollment: enrollments.find(e => idOf(e.course) === courseId) };
  }, [courseId, assignmentId, user.role]));
  if (resource.loading) return <Loading />;
  if (resource.error) return <><Link to={`/courses/${courseId}`} className="back-link"><ArrowLeft size={17} />Về lớp học</Link><ErrorNotice error={resource.error} retry={resource.reload} /></>;
  const { course, assignment, enrollment } = resource.data;
  const teacher = user.role === 'teacher' && idOf(course.teacher) === user._id;
  return <><Link to={`/courses/${courseId}`} className="back-link"><ArrowLeft size={17} />{course.title}</Link><PageHeading eyebrow="BÀI TẬP CỦA LỚP" title={assignment.title}>{teacher ? <Button variant="secondary" onClick={() => setEditor(true)}><Pencil size={16} />Sửa bài tập</Button> : null}</PageHeading>
    <section className="panel assignment-detail"><div className="assignment-meta"><Badge status={assignment.status} /><span><CalendarDays size={16} />Hạn nộp: {dateTime(assignment.dueAt)}</span><span><Trophy size={16} />{assignment.maxScore} điểm</span><span><ClipboardList size={16} />{({ text: 'Văn bản', file: 'File PDF/TXT', both: 'Văn bản hoặc file' })[assignment.submissionType]}</span></div><h2>Yêu cầu bài tập</h2><div className="prose-text">{assignment.description}</div></section>
    {teacher ? <TeacherSubmissions key={assignmentId} assignment={assignment} /> : user.role === 'student' ? <StudentSubmission key={assignmentId} assignment={assignment} course={course} enrollment={enrollment} /> : null}
    {editor ? <AssignmentEditor courseId={courseId} assignment={assignment} onClose={() => setEditor(false)} onSaved={() => { setEditor(false); resource.reload(); }} /> : null}
  </>;
}
