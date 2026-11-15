import { useCallback, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { request } from '../../api/httpClient';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { dateTime } from '../../utils/format';
import { Badge, ConfirmButton, Empty, ErrorNotice, Loading, Pagination } from '../common/UI';

export function StudentsPanel({ courseId }) {
  const [page, setPage] = useState(1);
  const resource = useResource(useCallback(signal => request(`/courses/${courseId}/enrollments`, { signal, query: { page, limit: 10 } }), [courseId, page]));
  const mutation = useMutation();
  async function complete(id) {
    const result = await mutation.run(() => request(`/courses/${courseId}/enrollments/${id}/complete`, { method: 'PATCH' }), 'Đã đánh dấu hoàn thành khóa học.');
    if (result.ok) resource.reload();
    return result.ok;
  }
  return <><div className="section-heading"><div><h2>Sinh viên ghi danh</h2><p className="muted">Theo dõi các thành viên trong lớp của bạn.</p></div></div><ErrorNotice error={mutation.error} />
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty icon={Users} title="Chưa có sinh viên ghi danh" description="Sinh viên có thể ghi danh khi khóa học được xuất bản." /> : <div className="table-wrap"><table><thead><tr><th>Sinh viên</th><th>Ngày ghi danh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.data.map(enrollment => <tr key={enrollment._id}><td><strong>{enrollment.student?.fullName || 'Tài khoản không còn tồn tại'}</strong><p className="table-description">{enrollment.student?.email}</p></td><td>{dateTime(enrollment.enrolledAt)}</td><td><Badge status={enrollment.status} /></td><td>{enrollment.status === 'active' ? <ConfirmButton variant="secondary" disabled={mutation.busy} title="Hoàn thành khóa học?" description="Sinh viên vẫn xem được tài liệu và điểm, nhưng không thể nộp thêm bài." onConfirm={() => complete(enrollment._id)}><Check size={15} />Hoàn thành</ConfirmButton> : '—'}</td></tr>)}</tbody></table></div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />
  </>;
}
