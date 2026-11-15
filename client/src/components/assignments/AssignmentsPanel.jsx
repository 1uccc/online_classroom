import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ClipboardList, Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import { request } from '../../api/httpClient';
import { assignmentApi } from '../../api/assignmentApi';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { dateTime } from '../../utils/format';
import { AssignmentEditor } from './AssignmentEditor';
import { Badge, Button, ConfirmButton, Empty, ErrorNotice, Loading, Pagination } from '../common/UI';

export function AssignmentsPanel({ courseId, teacher }) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const resource = useResource(useCallback(signal => request(`/courses/${courseId}/assignments`, { signal, query: { page, limit: 10 } }), [courseId, page]));
  const mutation = useMutation();
  async function remove(assignment) {
    const result = await mutation.run(() => assignmentApi.remove(courseId, assignment._id), 'Đã xóa bài tập.');
    if (result.ok) { if (resource.data.data.length === 1 && page > 1) setPage(page - 1); else resource.reload(); }
    return result.ok;
  }
  return <><div className="section-heading"><div><h2>Bài tập của lớp</h2><p className="muted">{teacher ? 'Giao bài và theo dõi kết quả của sinh viên.' : 'Đọc yêu cầu, nộp bài và nhận phản hồi.'}</p></div>{teacher ? <Button onClick={() => setEditor({})}><Plus size={16} />Tạo bài tập</Button> : null}</div><ErrorNotice error={mutation.error} />
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty icon={ClipboardList} title="Chưa có bài tập" description={teacher ? 'Tạo bài tập đầu tiên cho lớp học.' : 'Bài tập sẽ hiển thị khi giảng viên xuất bản.'} /> : <div className="resource-list">{resource.data.data.map(assignment => <article className="resource-row" key={assignment._id}><span className="resource-icon resource-lilac"><ClipboardList size={23} /></span><div className="resource-summary"><Link className="table-title" to={`/courses/${courseId}/assignments/${assignment._id}`}>{assignment.title}</Link><p><Clock3 size={13} />{dateTime(assignment.dueAt)} · {assignment.maxScore} điểm</p><Badge status={assignment.status} /></div><div className="row-actions"><Link className="btn btn-secondary" to={`/courses/${courseId}/assignments/${assignment._id}`}>{teacher ? 'Xem bài nộp' : 'Mở bài tập'}<ArrowUpRight size={15} /></Link>{teacher ? <><Button variant="ghost" onClick={() => setEditor(assignment)}><Pencil size={15} />Sửa</Button><ConfirmButton title="Xóa bài tập?" description="Chỉ xóa được bài tập chưa có bài nộp." onConfirm={() => remove(assignment)}><Trash2 size={15} />Xóa</ConfirmButton></> : null}</div></article>)}</div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />{editor ? <AssignmentEditor courseId={courseId} assignment={editor._id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} /> : null}
  </>;
}
