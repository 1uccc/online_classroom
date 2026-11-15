import { Course } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { Enrollment } from '../models/Enrollment.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Material } from '../models/Material.js';
import { ownCourse, findCourse, readCourseContent, sameId } from './accessService.js';
import { removeFiles } from './storageService.js';
import { assert } from '../utils/AppError.js';

async function activeCategory(id) {
  assert(await Category.exists({ _id: id, isActive: true }), 400, 'Danh mục không tồn tại hoặc đã vô hiệu hóa.', 'INVALID_CATEGORY');
}
export async function createCourse(user, data) {
  await activeCategory(data.category);
  return Course.create({ ...data, teacher: user._id, status: 'draft' });
}
export async function courseDetail(user, id) {
  const course = await findCourse(id);
  if (course.status === 'published' || (user?.role === 'teacher' && sameId(course.teacher, user._id))) return course;
  return readCourseContent(user, id);
}
export async function updateCourse(user, id, data) {
  const course = await ownCourse(user, id);
  if (data.category) await activeCategory(data.category);
  Object.assign(course, data);
  return course.save();
}
export async function updateStatus(user, id, status) {
  const course = await ownCourse(user, id);
  if (status === 'draft') assert(!await Enrollment.exists({ course: id }), 409, 'Khóa học có ghi danh phải dùng trạng thái archived.', 'RESOURCE_IN_USE');
  if (status === 'published') await activeCategory(course.category);
  course.status = status;
  return course.save();
}
export async function deleteCourse(user, id) {
  const course = await ownCourse(user, id);
  assert(course.status === 'draft', 409, 'Chỉ xóa khóa học nháp.', 'INVALID_STATE');
  assert(!await Enrollment.exists({ course: id }), 409, 'Khóa học đã có ghi danh.', 'RESOURCE_IN_USE');
  const assignmentIds = await Assignment.find({ course: id }).distinct('_id');
  assert(!await Submission.exists({ assignment: { $in: assignmentIds } }), 409, 'Khóa học đã có bài nộp.', 'RESOURCE_IN_USE');
  const materials = await Material.find({ course: id }).select('+file.storageKey');
  await Assignment.deleteMany({ course: id });
  await Material.deleteMany({ course: id });
  await course.deleteOne();
  await removeFiles(materials.map(m => m.file));
}
