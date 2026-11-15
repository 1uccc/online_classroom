import { Material } from '../models/Material.js';
import { ownCourse, readCourseContent } from './accessService.js';
import { storeFile, removeFiles } from './storageService.js';
import { assert } from '../utils/AppError.js';

function checkContent(type, data, upload, existing) {
  assert(type === 'pdf' || !upload, 400, 'Chỉ tài liệu PDF được đính kèm file.', 'INVALID_MATERIAL');
  assert(type === 'text' || data.content === undefined, 400, 'content chỉ dùng cho tài liệu text.', 'INVALID_MATERIAL');
  assert(type === 'video' || data.videoUrl === undefined, 400, 'videoUrl chỉ dùng cho video.', 'INVALID_MATERIAL');
  if (type === 'pdf') assert(upload || existing?.file, 400, 'Cần đính kèm file PDF.', 'INVALID_MATERIAL');
  if (type === 'text') assert((data.content ?? existing?.content)?.trim(), 400, 'Cần nội dung text.', 'INVALID_MATERIAL');
  if (type === 'video') assert(data.videoUrl ?? existing?.videoUrl, 400, 'Cần videoUrl.', 'INVALID_MATERIAL');
}
export async function getMaterial(user, courseId, materialId, withStorage = false) {
  await readCourseContent(user, courseId);
  let query = Material.findOne({ _id: materialId, course: courseId });
  if (withStorage) query = query.select('+file.storageKey');
  const material = await query;
  assert(material, 404, 'Không tìm thấy tài liệu.', 'NOT_FOUND');
  return material;
}
export async function createMaterial(user, courseId, data, upload) {
  await ownCourse(user, courseId);
  checkContent(data.type, data, upload);
  let file;
  try {
    if (upload) file = await storeFile(upload, true);
    return await Material.create({ ...data, course: courseId, ...(file && { file }) });
  } catch (error) { await removeFiles([file]); throw error; }
}
export async function updateMaterial(user, courseId, materialId, data, upload) {
  await ownCourse(user, courseId);
  assert(upload || Object.keys(data).length > 0, 400, 'Cần ít nhất một trường cập nhật hoặc file.', 'VALIDATION_ERROR');
  const material = await Material.findOne({ _id: materialId, course: courseId }).select('+file.storageKey');
  assert(material, 404, 'Không tìm thấy tài liệu.', 'NOT_FOUND');
  checkContent(material.type, data, upload, material);
  const oldFile = material.file;
  let file;
  try {
    if (upload) file = await storeFile(upload, true);
    Object.assign(material, data);
    if (file) material.file = file;
    await material.save();
  } catch (error) { await removeFiles([file]); throw error; }
  if (file) await removeFiles([oldFile]);
  return material;
}
export async function deleteMaterial(user, courseId, materialId) {
  await ownCourse(user, courseId);
  const material = await Material.findOne({ _id: materialId, course: courseId }).select('+file.storageKey');
  assert(material, 404, 'Không tìm thấy tài liệu.', 'NOT_FOUND');
  await material.deleteOne();
  await removeFiles([material.file]);
}
