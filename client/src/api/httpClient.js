const baseUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const storageKey = 'classroom.accessToken.v1';
let token;
try { token = sessionStorage.getItem(storageKey); } catch { token = null; }

export function setAccessToken(value) {
  token = value || null;
  try {
    if (token) sessionStorage.setItem(storageKey, token);
    else sessionStorage.removeItem(storageKey);
  } catch { /* The current session still works when storage is unavailable. */ }
}
export const hasAccessToken = () => Boolean(token);

export class ApiError extends Error {
  constructor(message, status = 0, code, errors = []) {
    super(message); this.status = status; this.code = code; this.errors = errors;
  }
}

export async function request(path, { method = 'GET', body, signal, binary = false, query } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const headers = new Headers();
  const requestToken = token;
  if (requestToken) headers.set('Authorization', `Bearer ${requestToken}`);
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${baseUrl}${path}${params.size ? `?${params}` : ''}`, {
      method, headers, signal, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    // Ignore stale failures from requests belonging to a previous login session.
    if (requestToken && token === requestToken && (response.status === 401 || payload.code === 'ACCOUNT_DISABLED')) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent('classroom:session-ended', { detail: payload.message }));
    }
    throw new ApiError(payload.message || 'Không thể thực hiện yêu cầu.', response.status, payload.code, payload.errors);
  }
  if (response.status === 204) return null;
  return binary ? response.blob() : response.json();
}

export async function download(path, filename) {
  const blob = await request(path, { binary: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename || 'download';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function allPages(path, { signal, query = {} } = {}) {
  const first = await request(path, { signal, query: { ...query, page: 1, limit: 100 } });
  const pages = [];
  for (let page = 2; page <= first.pagination.totalPages; page++) pages.push(page);
  const rest = await Promise.all(pages.map(page => request(path, { signal, query: { ...query, page, limit: 100 } })));
  return [...first.data, ...rest.flatMap(page => page.data)];
}
