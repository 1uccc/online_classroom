import { Course } from '../models/Course.js';
import * as service from '../services/courseService.js';
import { success, list, escapeRegex } from '../utils/response.js';

export function getCourses(req, res) {
  const q = req.validated.query;
  const filter = { status: 'published' };
  if (q.category) filter.category = q.category;
  if (q.search) filter.title = { $regex: escapeRegex(q.search), $options: 'i' };
  return list(res, Course, filter, q, { populate: [{ path: 'teacher', select: 'fullName' }, { path: 'category', select: 'name slug' }] });
}
export function getMine(req, res) { return list(res, Course, { teacher: req.user._id }, req.validated.query); }
export async function getCourse(req, res) { return success(res, await service.courseDetail(req.user, req.params.courseId)); }
export async function createCourse(req, res) { return success(res, await service.createCourse(req.user, req.validated.body), 201); }
export async function updateCourse(req, res) { return success(res, await service.updateCourse(req.user, req.params.courseId, req.validated.body)); }
export async function updateStatus(req, res) { return success(res, await service.updateStatus(req.user, req.params.courseId, req.validated.body.status)); }
export async function deleteCourse(req, res) { await service.deleteCourse(req.user, req.params.courseId); return res.status(204).end(); }
