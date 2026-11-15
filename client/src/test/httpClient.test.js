import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allPages, hasAccessToken, request, setAccessToken } from '../api/httpClient';

const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { setAccessToken(null); vi.stubGlobal('fetch', vi.fn()); });

describe('API transport', () => {
  it('sends Bearer authentication and only defined query parameters', async () => {
    setAccessToken('test-token'); fetch.mockResolvedValue(response({ success: true, data: [] }));
    await request('/courses', { query: { page: 2, search: 'React & Node', category: '', active: false } });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/v1/courses?page=2&search=React+%26+Node&active=false');
    expect(options.headers.get('Authorization')).toBe('Bearer test-token');
  });
  it('lets the browser generate the multipart boundary', async () => {
    fetch.mockResolvedValue(response({ data: {} }));
    const body = new FormData(); body.append('file', new File(['file'], 'lesson.txt'));
    await request('/upload', { method: 'POST', body });
    expect(fetch.mock.calls[0][1].body).toBe(body);
    expect(fetch.mock.calls[0][1].headers.has('Content-Type')).toBe(false);
  });
  it('expires the session on an authenticated 401 and preserves server details', async () => {
    setAccessToken('expired');
    const ended = vi.fn(); window.addEventListener('classroom:session-ended', ended, { once: true });
    fetch.mockResolvedValue(response({ message: 'JWT hết hạn', code: 'INVALID_TOKEN' }, 401));
    await expect(request('/auth/me')).rejects.toMatchObject({ status: 401, message: 'JWT hết hạn' });
    expect(ended).toHaveBeenCalledOnce(); expect(hasAccessToken()).toBe(false);
  });
  it('does not invalidate a new session when an older request fails', async () => {
    setAccessToken('old'); let resolve;
    fetch.mockReturnValue(new Promise(done => { resolve = done; }));
    const pending = request('/auth/me'); setAccessToken('new');
    resolve(response({ message: 'expired' }, 401));
    await expect(pending).rejects.toMatchObject({ status: 401 }); expect(hasAccessToken()).toBe(true);
  });
  it('supports deletion without a JSON body and readable network errors', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 })).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await request('/courses/id', { method: 'DELETE' })).toBeNull();
    await expect(request('/courses')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Không kết nối') });
  });
  it('loads every category page instead of silently truncating at 100 records', async () => {
    fetch.mockResolvedValueOnce(response({ data: [{ _id: '1' }], pagination: { totalPages: 2 } })).mockResolvedValueOnce(response({ data: [{ _id: '2' }], pagination: { totalPages: 2 } }));
    expect(await allPages('/categories')).toEqual([{ _id: '1' }, { _id: '2' }]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
