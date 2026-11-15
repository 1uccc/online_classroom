import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { ownCourse, readCourseContent, findAssignment } from './accessService.js';
import { assert } from '../utils/AppError.js';

export async function getAssignment(user, courseId, assignmentId) {
  await readCourseContent(user, courseId);
  const assignment = await findAssignment(assignmentId, courseId);
  assert(user.role === 'teacher' || assignment.status !== 'draft', 404, 'Không tìm thấy bài tập.', 'NOT_FOUND');
  return assignment;
}
export async function createAssignment(user, courseId, data) {
  await ownCourse(user, courseId);
  return Assignment.create({ ...data, course: courseId, status: 'draft' });
}
export async function updateAssignment(user, courseId, assignmentId, data) {
  await ownCourse(user, courseId);
  const assignment = await findAssignment(assignmentId, courseId);
  const hasSubmissions = await Submission.exists({ assignment: assignmentId });
  if (hasSubmissions) {
    assert(data.status !== 'draft', 409, 'Bài tập có bài nộp không thể chuyển về draft.', 'RESOURCE_IN_USE');
    assert(!data.submissionType || data.submissionType === assignment.submissionType, 409, 'Không thể đổi hình thức khi đã có bài nộp.', 'RESOURCE_IN_USE');
  }
  if (data.maxScore !== undefined) {
    assert(!await Submission.exists({ assignment: assignmentId, score: { $gt: data.maxScore } }), 409, 'Thang điểm thấp hơn điểm đã chấm.', 'INVALID_MAX_SCORE');
  }
  Object.assign(assignment, data);
  return assignment.save();
}
export async function deleteAssignment(user, courseId, assignmentId) {
  await ownCourse(user, courseId);
  const assignment = await findAssignment(assignmentId, courseId);
  assert(!await Submission.exists({ assignment: assignmentId }), 409, 'Bài tập đã có bài nộp.', 'RESOURCE_IN_USE');
  await assignment.deleteOne();
}
