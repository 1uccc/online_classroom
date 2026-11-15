import { ArrowUpRight, BookOpen, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../common/UI';
import { initials } from '../../utils/format';

export function CourseCard({ course, categoryName, enrollment }) {
  if (!course?._id) return null;
  const tone = [...course._id].reduce((sum, value) => sum + value.charCodeAt(0), 0) % 4;
  return <Link to={`/courses/${course._id}`} className="course-card">
    <div className={`course-art art-${tone}`}>
      {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} /> : null}
      <span className="art-circle" /><span className="art-grid" /><BookOpen className="art-book" size={68} strokeWidth={1.15} />
      <span className="course-art-label">{categoryName || course.category?.name || 'Lớp học trực tuyến'}</span><span className="course-art-arrow"><ArrowUpRight size={19} /></span>
    </div>
    <div className="course-card-body"><div className="card-meta"><span className="eyebrow">CLASSROOM</span>{enrollment ? <Badge status={enrollment.status} /> : <Badge status={course.status} />}</div>
      <h3>{course.title}</h3><p className="course-description">{course.description || 'Mở lớp học để xem tài liệu và bài tập.'}</p>
      <div className="course-card-footer"><span className="teacher-avatar">{course.teacher?.fullName ? initials(course.teacher.fullName) : <UserRound size={14} />}</span><span>{course.teacher?.fullName || 'Không gian lớp học'}</span><ArrowUpRight size={17} className="ml-auto" /></div>
    </div>
  </Link>;
}
