import { useCallback, useState } from 'react';
import { CheckCircle2, Download, FileText, Send } from 'lucide-react';
import { request, download } from '../../api/httpClient';
import { assignmentApi } from '../../api/assignmentApi';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { checkFiles, dateTime } from '../../utils/format';
import { Badge, Button, ErrorNotice, Field, Loading } from '../common/UI';

function SubmissionForm({ assignment, previous, onSaved, onCancel }) {
  const [answer, setAnswer] = useState(previous?.textAnswer || '');
  const [files, setFiles] = useState([]);
  const [validation, setValidation] = useState(null);
  const mutation = useMutation();
  async function submit(event) {
    event.preventDefault(); setValidation(null);
    try {
      checkFiles(files);
      if (!answer.trim() && !files.length) throw new Error('Hãy nhập câu trả lời hoặc chọn file để nộp.');
    } catch (error) { setValidation(error); return; }
    let body = { textAnswer: answer };
    if (files.length) {
      body = new FormData();
      if (assignment.submissionType !== 'file') body.append('textAnswer', answer);
      files.forEach(file => body.append('attachments', file));
    }
    const result = await mutation.run(() => assignmentApi.submit(assignment._id, body, Boolean(previous)), previous ? 'Đã cập nhật bài nộp.' : 'Đã nộp bài thành công.');
    if (result.ok) onSaved();
  }
  return <form className="form-stack" onSubmit={submit}><ErrorNotice error={validation || mutation.error} />
    {previous ? <div className="notice">Nộp lại sẽ thay toàn bộ nội dung và file hiện tại. Nếu muốn giữ file, hãy chọn lại file đó trước khi lưu.</div> : null}
    {assignment.submissionType !== 'file' ? <Field label="Nội dung bài làm"><textarea rows={8} value={answer} onChange={event => setAnswer(event.target.value)} required={assignment.submissionType === 'text'} maxLength={100000} placeholder="Trình bày bài làm của bạn tại đây…" /></Field> : null}
    {assignment.submissionType !== 'text' ? <Field label="File bài làm" hint="PDF hoặc TXT UTF-8 · Tối đa 5 file, 10 MB/file."><input type="file" multiple accept=".pdf,.txt,application/pdf,text/plain" required={assignment.submissionType === 'file'} onChange={event => setFiles([...event.target.files])} /></Field> : null}
    {files.length ? <ul className="selected-files">{files.map((file, index) => <li key={`${file.name}-${index}`}><FileText size={15} />{file.name}<span>{(file.size / 1024).toFixed(1)} KB</span></li>)}</ul> : null}
    <div className="form-actions">{previous ? <Button variant="secondary" onClick={onCancel}>Hủy chỉnh sửa</Button> : null}<Button type="submit" busy={mutation.busy}><Send size={16} />{previous ? 'Lưu bài nộp mới' : 'Nộp bài'}</Button></div>
  </form>;
}

export function StudentSubmission({ assignment, course, enrollment }) {
  const [editing, setEditing] = useState(false);
  const resource = useResource(useCallback(async signal => {
    try { return (await request(`/assignments/${assignment._id}/submissions/me`, { signal })).data; }
    catch (error) { if (error.status === 404) return null; throw error; }
  }, [assignment._id]));
  const mutation = useMutation();
  const submission = resource.data;
  const open = course.status === 'published' && assignment.status === 'published' && enrollment?.status === 'active' && (!assignment.dueAt || new Date(assignment.dueAt).getTime() >= Date.now());
  const lockedReason = enrollment?.status !== 'active' ? 'Ghi danh của bạn hiện không ở trạng thái đang học.' : course.status !== 'published' ? 'Khóa học hiện không nhận bài nộp.' : assignment.status !== 'published' ? 'Bài tập hiện không nhận bài nộp.' : 'Đã quá hạn nộp bài.';
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorNotice error={resource.error} retry={resource.reload} />;
  return <section className="panel submission-panel"><div className="section-heading"><h2>Bài làm của bạn</h2>{submission ? <Badge status={submission.status} /> : <span className="badge badge-neutral">Chưa nộp</span>}</div><ErrorNotice error={mutation.error} />
    {submission?.status === 'graded' ? <div className="grade-result"><span><CheckCircle2 size={23} />KẾT QUẢ BÀI TẬP</span><strong>{submission.score}<small> / {assignment.maxScore}</small></strong><p>{submission.feedback || 'Giảng viên chưa để lại nhận xét.'}</p><small>Chấm lúc {dateTime(submission.gradedAt)}</small></div> : null}
    {submission && !editing ? <><p className="muted text-sm">Đã nộp lúc {dateTime(submission.submittedAt)}</p>{submission.textAnswer ? <div className="answer-content prose-text">{submission.textAnswer}</div> : null}<div className="attachment-list">{submission.attachments.map(file => <Button key={file._id} variant="secondary" busy={mutation.busy} onClick={() => mutation.run(() => download(`/submissions/${submission._id}/attachments/${file._id}/download`, file.originalName))}><Download size={15} />{file.originalName}</Button>)}</div>
      {submission.status !== 'graded' && open ? <div className="form-actions"><Button variant="secondary" onClick={() => setEditing(true)}>Chỉnh sửa bài nộp</Button></div> : null}
    </> : null}
    {!open && submission?.status !== 'graded' ? <div className="notice">{lockedReason}</div> : null}
    {open && submission?.status !== 'graded' && (!submission || editing) ? <SubmissionForm assignment={assignment} previous={submission} onSaved={() => { setEditing(false); resource.reload(); }} onCancel={() => setEditing(false)} /> : null}
  </section>;
}
