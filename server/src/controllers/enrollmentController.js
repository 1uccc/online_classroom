import { Enrollment } from '../models/Enrollment.js';
import * as service from '../services/enrollmentService.js';
import { ownCourse } from '../services/accessService.js';
import { success, list } from '../utils/response.js';

export async function enroll(req, res) {
  const result = await service.enroll(req.user, req.params.courseId);
  return success(res, result.enrollment, result.created ? 201 : 200);
}
export function getMine(req, res) {
  return list(res, Enrollment, { student: req.user._id }, req.validated.query, { populate: { path: 'course', select: 'title status teacher category' } });
}
export async function getStudents(req, res) {
  await ownCourse(req.user, req.params.courseId);
  return list(res, Enrollment, { course: req.params.courseId }, req.validated.query, { populate: { path: 'student', select: 'fullName email' } });
}
export async function cancel(req, res) { return success(res, await service.cancel(req.user, req.params.courseId)); }
export async function complete(req, res) { return success(res, await service.complete(req.user, req.params.courseId, req.params.enrollmentId)); }
