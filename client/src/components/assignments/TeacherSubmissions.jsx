import { useCallback, useState } from 'react';
import { ClipboardCheck, Download, Pencil } from 'lucide-react';
import { request, download } from '../../api/httpClient';
import { assignmentApi } from '../../api/assignmentApi';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { dateTime } from '../../utils/format';
import { Badge, Button, Empty, ErrorNotice, Field, Loading, Modal, Pagination } from '../common/UI';

function GradingDialog({ submission, assignment, onClose, onSaved }) {
  const [score, setScore] = useState(submission.score ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const mutation = useMutation();
  async function submit(event) {
    event.preventDefault();
    const result = await mutation.run(() => assignmentApi.grade(submission._id, { score: Number(score), feedback }), 'Đã lưu điểm và nhận xét.');
    if (result.ok) onSaved();
  }
  return <Modal title={`Bài nộp · ${submission.student?.fullName || 'Sinh viên'}`} onClose={onClose} wide><div className="grading-meta"><Badge status={submission.status} /><span className="muted">Nộp lúc {dateTime(submission.submittedAt)}</span></div>
    {submission.textAnswer ? <div className="answer-content prose-text">{submission.textAnswer}</div> : <p className="muted">Sinh viên nộp bài bằng file đính kèm.</p>}
    <div className="attachment-list">{submission.attachments.map(file => <Button variant="secondary" key={file._id} busy={mutation.busy} onClick={() => mutation.run(() => download(`/submissions/${submission._id}/attachments/${file._id}/download`, file.originalName))}><Download size={15} />{file.originalName}</Button>)}</div>
    <ErrorNotice error={mutation.error} /><form className="form-stack grading-form" onSubmit={submit}><Field label={`Điểm (tối đa ${assignment.maxScore})`}><input autoFocus type="number" min="0" max={assignment.maxScore} step="any" required value={score} onChange={event => setScore(event.target.value)} placeholder="Nhập điểm" /></Field><Field label="Nhận xét"><textarea rows={4} maxLength={10000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Góp ý để sinh viên tiến bộ hơn…" /></Field><div className="form-actions"><Button variant="secondary" onClick={onClose}>Đóng</Button><Button type="submit" busy={mutation.busy}>Lưu điểm</Button></div></form>
  </Modal>;
}
export function TeacherSubmissions({ assignment }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const resource = useResource(useCallback(signal => request(`/assignments/${assignment._id}/submissions`, { signal, query: { page, limit: 10 } }), [assignment._id, page]));
  return <section className="panel"><div className="section-heading"><div><h2>Bài nộp của sinh viên</h2><p className="muted">{resource.data ? `${resource.data.pagination.total} bài nộp` : 'Xem bài làm và gửi phản hồi.'}</p></div></div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty icon={ClipboardCheck} title="Chưa có bài nộp" description="Các bài làm sẽ xuất hiện tại đây khi sinh viên nộp bài." /> : <div className="table-wrap"><table><thead><tr><th>Sinh viên</th><th>Thời gian nộp</th><th>Trạng thái</th><th>Điểm</th><th>Thao tác</th></tr></thead><tbody>{resource.data.data.map(submission => <tr key={submission._id}><td><strong>{submission.student?.fullName || 'Sinh viên'}</strong><p className="table-description">{submission.student?.email}</p></td><td>{dateTime(submission.submittedAt)}</td><td><Badge status={submission.status} /></td><td>{submission.score === null ? '—' : `${submission.score}/${assignment.maxScore}`}</td><td><Button variant="secondary" onClick={() => setSelected(submission)}><Pencil size={15} />{submission.status === 'graded' ? 'Xem / sửa điểm' : 'Chấm bài'}</Button></td></tr>)}</tbody></table></div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />{selected ? <GradingDialog submission={selected} assignment={assignment} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); resource.reload(); }} /> : null}
  </section>;
}
