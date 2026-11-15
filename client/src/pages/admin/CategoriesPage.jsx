import { useCallback, useState } from 'react';
import { Pencil, Plus, Shapes, Trash2 } from 'lucide-react';
import { request } from '../../api/httpClient';
import { adminApi } from '../../api/adminApi';
import { useResource } from '../../hooks/useResource';
import { useMutation } from '../../hooks/useMutation';
import { Button, ConfirmButton, Empty, ErrorNotice, Field, Loading, Modal, PageHeading, Pagination } from '../../components/common/UI';

const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function CategoryEditor({ category, onClose, onSaved }) {
  const [form, setForm] = useState({ name: category?.name || '', slug: category?.slug || '', description: category?.description || '', isActive: category?.isActive ?? true });
  const [customSlug, setCustomSlug] = useState(Boolean(category));
  const mutation = useMutation();
  async function submit(event) {
    event.preventDefault();
    const result = await mutation.run(() => category ? adminApi.updateCategory(category._id, form) : adminApi.createCategory(form), 'Đã lưu danh mục.');
    if (result.ok) onSaved();
  }
  return <Modal title={category ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'} onClose={onClose}><ErrorNotice error={mutation.error} /><form className="form-stack" onSubmit={submit}>
    <Field label="Tên danh mục"><input autoFocus required maxLength={100} value={form.name} onChange={event => { const name = event.target.value; setForm(value => ({ ...value, name, ...(!customSlug && { slug: slugify(name) }) })); }} placeholder="Ví dụ: Lập trình Web" /></Field>
    <Field label="Slug" hint="Chữ thường không dấu, số và dấu gạch ngang."><input required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={event => { setCustomSlug(true); setForm(value => ({ ...value, slug: event.target.value })); }} placeholder="lap-trinh-web" /></Field>
    <Field label="Mô tả"><textarea rows={4} maxLength={2000} value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} /></Field>
    <label className="checkbox-label"><input type="checkbox" checked={form.isActive} onChange={event => setForm(value => ({ ...value, isActive: event.target.checked }))} />Danh mục đang hoạt động</label>
    <div className="form-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" busy={mutation.busy}>Lưu danh mục</Button></div>
  </form></Modal>;
}
export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const resource = useResource(useCallback(signal => request('/categories', { signal, query: { includeInactive: true, page, limit: 10 } }), [page]));
  const mutation = useMutation();
  async function remove(category) {
    const result = await mutation.run(() => adminApi.deleteCategory(category._id), 'Đã xóa danh mục.');
    if (result.ok) { if (resource.data.data.length === 1 && page > 1) setPage(page - 1); else resource.reload(); }
    return result.ok;
  }
  return <><PageHeading eyebrow="QUẢN TRỊ HỆ THỐNG" title="Danh mục khóa học" description="Sắp xếp kiến thức để việc khám phá trở nên dễ dàng hơn."><Button onClick={() => setEditor({})}><Plus size={17} />Tạo danh mục</Button></PageHeading><ErrorNotice error={mutation.error} />
    {resource.loading ? <Loading /> : resource.error ? <ErrorNotice error={resource.error} retry={resource.reload} /> : !resource.data.data.length ? <Empty icon={Shapes} title="Chưa có danh mục" description="Tạo danh mục đầu tiên để giảng viên có thể xây dựng khóa học."><Button onClick={() => setEditor({})}>Tạo danh mục</Button></Empty> : <div className="table-wrap"><table><thead><tr><th>Danh mục</th><th>Slug</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.data.map(category => <tr key={category._id}><td><strong>{category.name}</strong><p className="table-description">{category.description || 'Chưa có mô tả'}</p></td><td><code>{category.slug}</code></td><td><span className={`badge badge-${category.isActive ? 'active' : 'archived'}`}>{category.isActive ? 'Hoạt động' : 'Đã ngừng'}</span></td><td><div className="row-actions"><Button variant="secondary" onClick={() => setEditor(category)}><Pencil size={15} />Sửa</Button><ConfirmButton title="Xóa danh mục?" description={`Chỉ xóa được “${category.name}” khi không còn khóa học tham chiếu. Bạn có thể ngừng sử dụng danh mục bằng chức năng chỉnh sửa.`} onConfirm={() => remove(category)}><Trash2 size={15} />Xóa</ConfirmButton></div></td></tr>)}</tbody></table></div>}
    <Pagination pagination={resource.data?.pagination} onChange={setPage} />{editor ? <CategoryEditor category={editor._id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} /> : null}
  </>;
}
