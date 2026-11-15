import { Submission } from '../models/Submission.js';
import { ownCourse, findAssignment, sameId, canSubmit } from './accessService.js';
import { storeFile, removeFiles } from './storageService.js';
import { assert } from '../utils/AppError.js';

export async function getSubmission(user, id, withStorage = false) {
  let query = Submission.findById(id);
  if (withStorage) query = query.select('+attachments.storageKey');
  const submission = await query;
  assert(submission, 404, 'Không tìm thấy bài nộp.', 'NOT_FOUND');
  if (user.role === 'student') assert(sameId(submission.student, user._id), 403, 'Bạn không có quyền xem bài nộp.', 'FORBIDDEN');
  else {
    const assignment = await findAssignment(submission.assignment);
    await ownCourse(user, assignment.course);
  }
  return submission;
}
export async function submit(user, assignmentId, data, files, replace = false) {
  const assignment = await findAssignment(assignmentId);
  await canSubmit(user, assignment);
  const existing = await Submission.findOne({ assignment: assignmentId, student: user._id }).select('+attachments.storageKey');
  if (replace) {
    assert(existing, 404, 'Bạn chưa nộp bài.', 'NOT_FOUND');
    assert(existing.status !== 'graded', 409, 'Bài đã chấm không được sửa.', 'ALREADY_GRADED');
  } else assert(!existing, 409, 'Bạn đã nộp bài. Hãy dùng chức năng cập nhật.', 'ALREADY_SUBMITTED');
  const hasText = Boolean(data.textAnswer?.trim());
  const hasFiles = files.length > 0;
  assert(hasText || hasFiles, 400, 'Bài nộp cần nội dung hoặc file.', 'EMPTY_SUBMISSION');
  if (assignment.submissionType === 'text') assert(hasText && !hasFiles, 400, 'Bài tập chỉ nhận text.', 'INVALID_SUBMISSION_TYPE');
  if (assignment.submissionType === 'file') assert(hasFiles && !hasText, 400, 'Bài tập chỉ nhận file.', 'INVALID_SUBMISSION_TYPE');
  const newFiles = [];
  const oldFiles = existing?.attachments || [];
  let submission;
  try {
    for (const file of files) newFiles.push(await storeFile(file));
    submission = existing || new Submission({ assignment: assignmentId, student: user._id });
    submission.textAnswer = data.textAnswer;
    submission.attachments = newFiles;
    submission.submittedAt = new Date();
    await submission.save();
  } catch (error) { await removeFiles(newFiles); throw error; }
  await removeFiles(oldFiles);
  return submission;
}
export async function grade(user, id, data) {
  const submission = await Submission.findById(id);
  assert(submission, 404, 'Không tìm thấy bài nộp.', 'NOT_FOUND');
  const assignment = await findAssignment(submission.assignment);
  await ownCourse(user, assignment.course);
  assert(data.score <= assignment.maxScore, 400, 'Điểm vượt quá thang điểm của bài tập.', 'INVALID_SCORE');
  Object.assign(submission, data, { status: 'graded', gradedBy: user._id, gradedAt: new Date() });
  return submission.save();
}
