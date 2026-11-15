import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { assert } from '../utils/AppError.js';

export function storagePath(key) {
  assert(/^[a-f\d-]{36}\.(pdf|txt)$/.test(key || ''), 404, 'Không tìm thấy file.', 'NOT_FOUND');
  return path.join(env.UPLOAD_DIR, key);
}

export async function storeFile(file, pdfOnly = false) {
  assert(file?.buffer?.length > 0, 400, 'File không được trống.', 'INVALID_FILE');
  const isPdf = file.mimetype === 'application/pdf';
  assert(!pdfOnly || isPdf, 415, 'Tài liệu cần file PDF.', 'UNSUPPORTED_FILE_TYPE');
  if (isPdf) {
    assert(file.buffer.subarray(0, 5).toString('ascii') === '%PDF-', 415, 'Nội dung file không phải PDF.', 'INVALID_FILE');
  } else {
    assert(file.mimetype === 'text/plain' && !file.buffer.includes(0), 415, 'File TXT không hợp lệ.', 'INVALID_FILE');
    try { new TextDecoder('utf-8', { fatal: true }).decode(file.buffer); }
    catch { assert(false, 415, 'File TXT phải dùng UTF-8.', 'INVALID_FILE'); }
  }
  const storageKey = `${randomUUID()}.${isPdf ? 'pdf' : 'txt'}`;
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  await writeFile(storagePath(storageKey), file.buffer, { flag: 'wx' });
  const originalName = file.originalname.replace(/\\/g, '/').split('/').pop().replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200) || 'download';
  return { storageKey, originalName, mimeType: file.mimetype, size: file.size };
}

export async function removeFiles(files) {
  await Promise.all(files.filter(f => f?.storageKey).map(async file => {
    try { await unlink(storagePath(file.storageKey)); }
    catch (error) {
      if (error.code !== 'ENOENT') console.error('Không thể dọn file upload; cần kiểm tra storage.');
    }
  }));
}

export function download(res, file, next) {
  assert(file?.storageKey, 404, 'Không tìm thấy file.', 'NOT_FOUND');
  res.set('Cache-Control', 'private, no-store');
  res.download(storagePath(file.storageKey), file.originalName, { headers: { 'Content-Type': 'application/octet-stream' } }, error => {
    if (error) next(error.code === 'ENOENT' ? Object.assign(error, { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy file.' }) : error);
  });
}
