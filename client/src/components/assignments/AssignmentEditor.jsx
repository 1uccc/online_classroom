import { useState } from 'react';
import { assignmentApi } from '../../api/assignmentApi';
import { useMutation } from '../../hooks/useMutation';
import { dateInput, dateToISO } from '../../utils/format';
import { Button, ErrorNotice, Field, Modal } from '../common/UI';

export function AssignmentEditor({ courseId, assignment, onClose, onSaved }) {
  const [form, setForm] = useState({ title: assignment?.title || '', description: assignment?.description || '', dueAt: dateInput(assignment?.dueAt), maxScore: assignment?.maxScore ?? 10, submissionType: assignment?.submissionType || 'both', status: assignment?.status || 'draft' });
  const mutation = useMutation();
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    const payload = { title: form.title, description: form.description, dueAt: dateToISO(form.dueAt), maxScore: Number(form.maxScore), submissionType: form.submissionType, ...(assignment && { status: form.status }) };
    const result = await mutation.run(() => assignment ? assignmentApi.update(courseId, assignment._id, payload) : assignmentApi.create(courseId, payload), assignment ? 'Đã cập nhật bài tập.' : 'Đã tạo bài tập nháp.');
    if (result.ok) onSaved(result.value.data);
  }
  return <Modal title={assignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập'} onClose={onClose} wide><ErrorNotice error={mutation.error} /><form className="form-stack" onSubmit={submit}>
    <Field label="Tên bài tập"><input autoFocus name="title" required maxLength={200} value={form.title} onChange={update} /></Field><Field label="Yêu cầu bài tập"><textarea name="description" required rows={6} maxLength={20000} value={form.description} onChange={update} /></Field>
    <div className="form-grid"><Field label="Hạn nộp (giờ Việt Nam)" hint="Để trống nếu không giới hạn thời gian."><input name="dueAt" type="datetime-local" value={form.dueAt} onChange={update} /></Field><Field label="Điểm tối đa"><input name="maxScore" type="number" step="any" min="0.01" max="10000" required value={form.maxScore} onChange={update} /></Field></div>
    <div className="form-grid"><Field label="Hình thức nộp bài"><select name="submissionType" value={form.submissionType} onChange={update}><option value="both">Văn bản hoặc file</option><option value="text">Chỉ văn bản</option><option value="file">Chỉ file</option></select></Field>{assignment ? <Field label="Trạng thái"><select name="status" value={form.status} onChange={update}><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="closed">Đã đóng</option></select></Field> : null}</div>
    {!assignment ? <p className="form-hint">Bài tập mới là bản nháp. Xuất bản khi bạn đã sẵn sàng nhận bài.</p> : null}<div className="form-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" busy={mutation.busy}>Lưu bài tập</Button></div>
  </form></Modal>;
}
