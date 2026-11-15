export const roleLabels = { admin: 'Quản trị viên', teacher: 'Giảng viên', student: 'Sinh viên' };
export const statusLabels = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Đã lưu trữ', active: 'Đang học', completed: 'Hoàn thành', cancelled: 'Đã hủy', closed: 'Đã đóng', submitted: 'Đã nộp', graded: 'Đã chấm' };
export const idOf = value => value?._id || value;
export const initials = name => (name || 'Classroom').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
export function dateTime(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Không giới hạn';
}
export function dateInput(value) {
  if (!value) return '';
  return new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16);
}
export const dateToISO = value => value ? new Date(`${value}:00+07:00`).toISOString() : null;
export const passwordValid = value => value.length >= 12 && new TextEncoder().encode(value).length <= 72;

export function checkFiles(files, pdfOnly = false) {
  if (files.length > 5) throw new Error('Chỉ được chọn tối đa 5 file.');
  for (const file of files) {
    if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Mỗi file phải có dữ liệu và không vượt quá 10 MB.');
    if (!(pdfOnly ? /\.pdf$/i : /\.(pdf|txt)$/i).test(file.name)) throw new Error(pdfOnly ? 'Vui lòng chọn file PDF.' : 'Chỉ hỗ trợ file PDF hoặc TXT.');
  }
}
