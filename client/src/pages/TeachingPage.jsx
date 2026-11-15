import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { request } from '../api/httpClient';
import { courseApi } from '../api/courseApi';
import { useResource } from '../hooks/useResource';
import { useMutation } from '../hooks/useMutation';
import { CourseEditor } from '../components/courses/CourseEditor';
import { Badge, Button, ConfirmButton, Empty, ErrorNotice, Loading, PageHeading, Pagination } from '../components/common/UI';

export default function TeachingPage() {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const resource = useResource(useCallback(signal => request('/courses/mine', { signal, query: { page, limit: 10 } }), [page]));
  const mutation = useMutation();
  async function remove(id) {
    const result = await mutation.run(() => courseApi.remove(id), 'Đã xóa khóa học.');
    if (result.ok) { if (resource.data.data.length === 1 && page > 1) setPage(page - 1); else resource.reload(); }
    return result.ok;
  }
  return <><PageHeading eyebrow="KHÔNG GIAN GIẢNG DẠY" title="Lớp học giảng dạy" description="Tạo bài giảng, giao bài tập và đồng hành cùng sinh viên."><Button onClick={() => setEditor({})}><Plus size={17} />Tạo khóa học</Button></PageHeading><ErrorNotice error={mutation.error} />
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty title="Chia sẻ kiến thức đầu tiên của bạn" description="Tạo khóa học mới, thêm tài liệu và sẵn sàng đón sinh viên."><Button onClick={() => setEditor({})}><Plus size={17} />Tạo khóa học</Button></Empty> : <div className="table-wrap"><table><thead><tr><th>Khóa học</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.data.map(course => <tr key={course._id}><td><Link to={`/courses/${course._id}`} className="table-title">{course.title}</Link><p className="table-description">{course.description}</p></td><td><Badge status={course.status} /></td><td><div className="row-actions"><Link to={`/courses/${course._id}`} className="btn btn-secondary">Mở lớp<ArrowUpRight size={15} /></Link><Button variant="ghost" onClick={() => setEditor(course)}><Pencil size={15} />Sửa</Button>{course.status === 'draft' ? <ConfirmButton title="Xóa khóa học?" description="Khóa học nháp và các tài liệu, bài tập chưa có bài nộp sẽ được xóa." onConfirm={() => remove(course._id)}><Trash2 size={15} />Xóa</ConfirmButton> : null}</div></td></tr>)}</tbody></table></div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />{editor ? <CourseEditor course={editor._id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} /> : null}
  </>;
}
