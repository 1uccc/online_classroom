import { Category } from '../models/Category.js';
import { Course } from '../models/Course.js';
import { assert } from '../utils/AppError.js';
import { success, list } from '../utils/response.js';

export function getCategories(req, res) {
  const q = req.validated.query;
  if (q.includeInactive) assert(req.user?.role === 'admin', 403, 'Chỉ Admin được xem danh mục vô hiệu hóa.', 'FORBIDDEN');
  return list(res, Category, req.user?.role === 'admin' && q.includeInactive ? {} : { isActive: true }, q);
}
export async function getCategory(req, res) {
  const category = await Category.findById(req.params.categoryId);
  assert(category && (category.isActive || req.user?.role === 'admin'), 404, 'Không tìm thấy danh mục.', 'NOT_FOUND');
  return success(res, category);
}
export async function createCategory(req, res) { return success(res, await Category.create(req.validated.body), 201); }
export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.categoryId);
  assert(category, 404, 'Không tìm thấy danh mục.', 'NOT_FOUND');
  Object.assign(category, req.validated.body);
  await category.save();
  return success(res, category);
}
export async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.categoryId);
  assert(category, 404, 'Không tìm thấy danh mục.', 'NOT_FOUND');
  assert(!await Course.exists({ category: category._id }), 409, 'Danh mục đang có khóa học.', 'RESOURCE_IN_USE');
  await category.deleteOne();
  return res.status(204).end();
}
