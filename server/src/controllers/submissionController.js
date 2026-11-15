import { Submission } from '../models/Submission.js';
import * as service from '../services/submissionService.js';
import { findAssignment, ownCourse } from '../services/accessService.js';
import { download } from '../services/storageService.js';
import { assert } from '../utils/AppError.js';
import { success, list } from '../utils/response.js';

export async function createSubmission(req, res) { return success(res, await service.submit(req.user, req.params.assignmentId, req.validated.body, req.files || []), 201); }
export async function replaceMine(req, res) { return success(res, await service.submit(req.user, req.params.assignmentId, req.validated.body, req.files || [], true)); }
export async function getMine(req, res) {
  const submission = await Submission.findOne({ assignment: req.params.assignmentId, student: req.user._id });
  assert(submission, 404, 'Bạn chưa nộp bài.', 'NOT_FOUND');
  return success(res, submission);
}
export async function getSubmissions(req, res) {
  const assignment = await findAssignment(req.params.assignmentId);
  await ownCourse(req.user, assignment.course);
  return list(res, Submission, { assignment: assignment._id }, req.validated.query, { populate: { path: 'student', select: 'fullName email' } });
}
export async function getSubmission(req, res) { return success(res, await service.getSubmission(req.user, req.params.submissionId)); }
export async function downloadAttachment(req, res, next) {
  const submission = await service.getSubmission(req.user, req.params.submissionId, true);
  const file = submission.attachments.id(req.params.attachmentId);
  assert(file, 404, 'Không tìm thấy file đính kèm.', 'NOT_FOUND');
  return download(res, file, next);
}
export async function grade(req, res) { return success(res, await service.grade(req.user, req.params.submissionId, req.validated.body)); }
