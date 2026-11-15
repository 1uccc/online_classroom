import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { request } from '../api/httpClient';
import { useResource } from '../hooks/useResource';
import { CourseCard } from '../components/courses/CourseCard';
import { Empty, ErrorNotice, Loading, PageHeading, Pagination } from '../components/common/UI';

export default function LearningPage() {
  const [page, setPage] = useState(1);
  const resource = useResource(useCallback(signal => request('/enrollments/me', { signal, query: { page, limit: 9 } }), [page]));
  return <><PageHeading eyebrow="HÀNH TRÌNH HỌC TẬP" title="Lớp học của tôi" description="Tất cả lớp học đã ghi danh và những kiến thức đang chờ bạn."><Link className="btn btn-secondary" to="/courses"><Compass size={17} />Khám phá thêm</Link></PageHeading>
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : resource.data.data.length ? <div className="course-grid">{resource.data.data.map(enrollment => <CourseCard key={enrollment._id} course={enrollment.course} enrollment={enrollment} />)}</div> : <Empty title="Bạn chưa ghi danh lớp học nào" description="Chọn một khóa học phù hợp để bắt đầu."><Link to="/courses" className="btn btn-primary">Khám phá khóa học</Link></Empty>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />
  </>;
}
