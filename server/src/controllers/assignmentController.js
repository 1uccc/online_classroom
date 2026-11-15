import { Assignment } from '../models/Assignment.js';
import * as service from '../services/assignmentService.js';
import { readCourseContent } from '../services/accessService.js';
import { success, list } from '../utils/response.js';

export async function getAssignments(req, res) {
  await readCourseContent(req.user, req.params.courseId);
  const filter = { course: req.params.courseId };
  if (req.user.role === 'student') filter.status = { $in: ['published', 'closed'] };
  return list(res, Assignment, filter, req.validated.query);
}
export async function getAssignment(req, res) { return success(res, await service.getAssignment(req.user, req.params.courseId, req.params.assignmentId)); }
export async function createAssignment(req, res) { return success(res, await service.createAssignment(req.user, req.params.courseId, req.validated.body), 201); }
export async function updateAssignment(req, res) { return success(res, await service.updateAssignment(req.user, req.params.courseId, req.params.assignmentId, req.validated.body)); }
export async function deleteAssignment(req, res) { await service.deleteAssignment(req.user, req.params.courseId, req.params.assignmentId); return res.status(204).end(); }
