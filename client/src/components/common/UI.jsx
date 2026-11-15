import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Loader2, X } from 'lucide-react';
import { statusLabels } from '../../utils/format';

export function Button({ children, busy, variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={`btn btn-${variant} ${className}`} {...props} disabled={busy || props.disabled} aria-busy={busy || undefined}>
    {busy ? <Loader2 size={17} className="spin" aria-hidden="true" /> : null}{children}
  </button>;
}
export function Field({ label, hint, children, className = '' }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}
export function ErrorNotice({ error, retry }) {
  if (!error) return null;
  return <div className="notice error-notice" role="alert"><AlertCircle size={20} /><div><strong>{error.message || error}</strong>
    {error.errors?.length ? <ul>{error.errors.map((item, index) => <li key={`${item.field}-${index}`}>{item.field}: {item.message}</li>)}</ul> : null}
    {retry ? <button className="text-link" onClick={retry}>Thử lại</button> : null}
  </div></div>;
}
export function Loading({ label = 'Đang tải dữ liệu…' }) {
  return <div className="loading-state" role="status"><Loader2 className="spin" size={24} /><span>{label}</span></div>;
}
export function Empty({ title = 'Chưa có dữ liệu', description, children, icon: Icon = BookOpen }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={29} strokeWidth={1.5} /></span><h3>{title}</h3>{description ? <p>{description}</p> : null}{children}</div>;
}
export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className="muted">{description}</p> : null}</div><div className="heading-actions">{children}</div></div>;
}
export function Badge({ status, children }) {
  return <span className={`badge badge-${status || 'neutral'}`}>{children || statusLabels[status] || status}</span>;
}
export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages < 2) return null;
  return <nav className="pagination" aria-label="Phân trang"><span>{pagination.total} kết quả · Trang {pagination.page}/{pagination.totalPages}</span><div className="flex gap-2">
    <Button variant="secondary" disabled={pagination.page === 1} onClick={() => onChange(pagination.page - 1)}><ArrowLeft size={16} />Trước</Button>
    <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => onChange(pagination.page + 1)}>Sau<ArrowRight size={16} /></Button>
  </div></nav>;
}
export function Modal({ title, onClose, children, wide = false }) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); close.current(); }}>
    <div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-btn" aria-label="Đóng hộp thoại" onClick={onClose}><X size={21} /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}
export function ConfirmButton({ children, title, description, onConfirm, variant = 'danger', disabled }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return <><Button variant={variant} disabled={disabled} onClick={() => setOpen(true)}>{children}</Button>{open ? <Modal title={title} onClose={() => { if (!busy) setOpen(false); }}>
    <p className="muted">{description}</p><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Quay lại</Button>
      <Button variant={variant} busy={busy} onClick={async () => { setBusy(true); try { const ok = await onConfirm(); if (ok !== false) setOpen(false); } finally { setBusy(false); } }}>Xác nhận</Button></div>
  </Modal> : null}</>;
}
