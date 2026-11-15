import { useCallback, useState } from 'react';
import { Download, ExternalLink, FileText, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { request, download } from '../../api/httpClient';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { checkFiles } from '../../utils/format';
import { Button, ConfirmButton, Empty, ErrorNotice, Field, Loading, Modal, Pagination } from '../common/UI';

function MaterialEditor({ courseId, material, onClose, onSaved }) {
  const [form, setForm] = useState({ title: material?.title || '', type: material?.type || 'text', content: material?.content || '', videoUrl: material?.videoUrl || '', position: material?.position || 0 });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const mutation = useMutation();
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError(null);
    try { if (file) checkFiles([file], true); }
    catch (error) { setError(error); return; }
    const data = { title: form.title, position: Number(form.position), ...(!material && { type: form.type }),
      ...(form.type === 'text' && { content: form.content }), ...(form.type === 'video' && { videoUrl: form.videoUrl }) };
    let body = data;
    if (file) { body = new FormData(); Object.entries(data).forEach(([key, value]) => body.append(key, value)); body.append('file', file); }
    const result = await mutation.run(() => request(`/courses/${courseId}/materials${material ? `/${material._id}` : ''}`, { method: material ? 'PATCH' : 'POST', body }), 'Đã lưu tài liệu.');
    if (result.ok) onSaved();
  }
  return <Modal title={material ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu học tập'} onClose={onClose} wide><ErrorNotice error={error || mutation.error} /><form className="form-stack" onSubmit={submit}>
    <Field label="Tiêu đề"><input autoFocus name="title" required maxLength={200} value={form.title} onChange={update} /></Field><div className="form-grid"><Field label="Loại tài liệu"><select name="type" disabled={Boolean(material)} value={form.type} onChange={update}><option value="text">Bài đọc văn bản</option><option value="pdf">Tài liệu PDF</option><option value="video">Liên kết video</option></select></Field><Field label="Thứ tự hiển thị"><input type="number" name="position" min="0" max="100000" required value={form.position} onChange={update} /></Field></div>
    {form.type === 'text' ? <Field label="Nội dung"><textarea name="content" rows={9} required maxLength={100000} value={form.content} onChange={update} /></Field> : form.type === 'video' ? <Field label="Đường dẫn video"><input name="videoUrl" type="url" required value={form.videoUrl} onChange={update} placeholder="https://…" /></Field> : <Field label={material ? 'Thay file PDF (tùy chọn)' : 'File PDF'} hint={material?.file ? `File hiện tại: ${material.file.originalName}. Tối đa 10 MB.` : 'Tối đa 10 MB.'}><input type="file" accept=".pdf,application/pdf" required={!material} onChange={event => setFile(event.target.files[0] || null)} /></Field>}
    <div className="form-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" busy={mutation.busy}>Lưu tài liệu</Button></div>
  </form></Modal>;
}
export function MaterialsPanel({ courseId, teacher }) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [reading, setReading] = useState(null);
  const resource = useResource(useCallback(signal => request(`/courses/${courseId}/materials`, { signal, query: { page, limit: 10 } }), [courseId, page]));
  const mutation = useMutation();
  async function remove(material) {
    const result = await mutation.run(() => request(`/courses/${courseId}/materials/${material._id}`, { method: 'DELETE' }), 'Đã xóa tài liệu.');
    if (result.ok) { if (resource.data.data.length === 1 && page > 1) setPage(page - 1); else resource.reload(); }
    return result.ok;
  }
  return <><div className="section-heading"><div><h2>Tài liệu học tập</h2><p className="muted">Bài đọc, video và tài liệu của lớp.</p></div>{teacher ? <Button onClick={() => setEditor({})}><Plus size={16} />Thêm tài liệu</Button> : null}</div><ErrorNotice error={mutation.error} />
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty title="Chưa có tài liệu" description={teacher ? 'Thêm bài đọc, file PDF hoặc liên kết video cho sinh viên.' : 'Giảng viên sẽ cập nhật tài liệu tại đây.'} /> : <div className="resource-list">{resource.data.data.map(material => <article className="resource-row" key={material._id}><span className={`resource-icon ${material.type === 'video' ? 'resource-lilac' : ''}`}>{material.type === 'video' ? <Video size={23} /> : <FileText size={23} />}</span><div className="resource-summary"><h3>{material.title}</h3><p>{({ text: 'Bài đọc', pdf: 'Tài liệu PDF', video: 'Liên kết video' })[material.type]}{material.file ? ` · ${(material.file.size / 1024 / 1024).toFixed(2)} MB` : ''}</p></div><div className="row-actions">
      {material.type === 'pdf' ? <Button variant="secondary" busy={mutation.busy} onClick={() => mutation.run(() => download(`/courses/${courseId}/materials/${material._id}/download`, material.file.originalName))}><Download size={16} />Tải xuống</Button> : material.type === 'video' ? <a className="btn btn-secondary" href={material.videoUrl} target="_blank" rel="noopener noreferrer">Xem video<ExternalLink size={15} /></a> : <Button variant="secondary" onClick={() => setReading(material)}>Đọc bài</Button>}
      {teacher ? <><Button variant="ghost" onClick={() => setEditor(material)}><Pencil size={15} />Sửa</Button><ConfirmButton title="Xóa tài liệu?" description={`Tài liệu “${material.title}” sẽ được xóa khỏi lớp học.`} onConfirm={() => remove(material)}><Trash2 size={15} />Xóa</ConfirmButton></> : null}
    </div></article>)}</div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />{editor ? <MaterialEditor courseId={courseId} material={editor._id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} /> : null}{reading ? <Modal title={reading.title} onClose={() => setReading(null)} wide><div className="prose-text">{reading.content}</div></Modal> : null}
  </>;
}
