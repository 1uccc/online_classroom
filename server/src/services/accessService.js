import { Course } from '../models/Course.js';
import { Assignment } from '../models/Assignment.js';
import { Enrollment } from '../models/Enrollment.js';
import { assert } from '../utils/AppError.js';

export const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);

export async function findCourse(id) {
  const course = await Course.findById(id);
  assert(course, 404, 'Không tìm thấy khóa học.', 'NOT_FOUND');
  return course;
}

export async function ownCourse(user, id) {
  const course = await findCourse(id);
  assert(user?.role === 'teacher' && sameId(course.teacher, user._id), 403, 'Bạn không sở hữu khóa học.', 'FORBIDDEN');
  return course;
}

export async function readCourseContent(user, id) {
  const course = await findCourse(id);
  if (user?.role === 'teacher' && sameId(course.teacher, user._id)) return course;
  assert(user?.role === 'student', 403, 'Bạn không có quyền xem nội dung.', 'FORBIDDEN');
  assert(['published', 'archived'].includes(course.status), 403, 'Khóa học chưa mở nội dung.', 'FORBIDDEN');
  const enrolled = await Enrollment.exists({ course: id, student: user._id, status: { $in: ['active', 'completed'] } });
  assert(enrolled, 403, 'Bạn chưa ghi danh hợp lệ vào khóa học.', 'ENROLLMENT_REQUIRED');
  return course;
}

export async function findAssignment(id, courseId) {
  const assignment = await Assignment.findById(id);
  assert(assignment && (!courseId || sameId(assignment.course, courseId)), 404, 'Không tìm thấy bài tập.', 'NOT_FOUND');
  return assignment;
}

export async function canSubmit(user, assignment) {
  assert(user.role === 'student', 403, 'Chỉ Student được nộp bài.', 'FORBIDDEN');
  const course = await findCourse(assignment.course);
  assert(course.status === 'published' && assignment.status === 'published', 409, 'Khóa học hoặc bài tập không nhận bài nộp.', 'SUBMISSION_CLOSED');
  assert(!assignment.dueAt || assignment.dueAt.getTime() >= Date.now(), 409, 'Đã quá hạn nộp bài.', 'DEADLINE_PASSED');
  assert(await Enrollment.exists({ student: user._id, course: course._id, status: 'active' }), 403, 'Cần ghi danh đang hoạt động.', 'ENROLLMENT_REQUIRED');
}
