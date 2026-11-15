import { useCallback, useState } from 'react';
import { allPages } from '../../api/httpClient';
import { courseApi } from '../../api/courseApi';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { idOf } from '../../utils/format';
import { Button, ErrorNotice, Field, Loading, Modal } from '../common/UI';

export function CourseEditor({ course, onClose, onSaved }) {
  const [form, setForm] = useState({ title: course?.title || '', description: course?.description || '', category: idOf(course?.category) || '' });
  const categories = useResource(useCallback(signal => allPages('/categories', { signal }), []));
  const mutation = useMutation();
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    const payload = course ? Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== (key === 'category' ? idOf(course.category) : course[key]))) : form;
    if (!Object.keys(payload).length) return onClose();
    const result = await mutation.run(() => course ? courseApi.update(course._id, payload) : courseApi.create(payload), course ? 'Đã cập nhật khóa học.' : 'Đã tạo bản nháp khóa học.');
    if (result.ok) onSaved(result.value.data);
  }
  return <Modal title={course ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'} onClose={onClose} wide><ErrorNotice error={mutation.error} />{categories.loading ? <Loading /> : categories.error ? <ErrorNotice error={categories.error} retry={categories.reload} /> : <form className="form-stack" onSubmit={submit}>
    <Field label="Tên khóa học"><input autoFocus name="title" value={form.title} onChange={update} required maxLength={200} placeholder="Ví dụ: Lập trình React cơ bản" /></Field>
    <Field label="Danh mục"><select name="category" value={form.category} onChange={update} required><option value="">Chọn danh mục</option>
      {course && !categories.data.some(item => item._id === idOf(course.category)) ? <option value={idOf(course.category)}>Danh mục hiện tại (đã ngừng sử dụng)</option> : null}
      {categories.data.map(item => <option value={item._id} key={item._id}>{item.name}</option>)}
    </select></Field>{!categories.data.length ? <p className="notice">Cần quản trị viên tạo danh mục hoạt động trước khi tạo khóa học.</p> : null}
    <Field label="Giới thiệu khóa học"><textarea name="description" rows={6} required maxLength={20000} value={form.description} onChange={update} placeholder="Sinh viên sẽ học được gì trong lớp học này?" /></Field>
    <p className="form-hint">Khóa học mới được lưu ở dạng bản nháp. Bạn có thể chuẩn bị tài liệu trước khi xuất bản.</p>
    <div className="form-actions"><Button variant="secondary" onClick={onClose} disabled={mutation.busy}>Hủy</Button><Button type="submit" busy={mutation.busy}>Lưu khóa học</Button></div>
  </form>}</Modal>;
}
