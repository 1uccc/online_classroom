import { Enrollment } from '../models/Enrollment.js';
import { findCourse, ownCourse } from './accessService.js';
import { assert } from '../utils/AppError.js';

export async function enroll(user, courseId) {
  const course = await findCourse(courseId);
  assert(course.status === 'published', 409, 'Khóa học không nhận ghi danh.', 'ENROLLMENT_CLOSED');
  const existing = await Enrollment.findOne({ student: user._id, course: courseId });
  if (existing) {
    assert(existing.status === 'cancelled', 409, 'Bạn đã ghi danh khóa học.', 'ALREADY_ENROLLED');
    existing.status = 'active'; existing.enrolledAt = new Date(); existing.completedAt = null;
    return { enrollment: await existing.save(), created: false };
  }
  return { enrollment: await Enrollment.create({ student: user._id, course: courseId }), created: true };
}
export async function cancel(user, courseId) {
  const enrollment = await Enrollment.findOne({ student: user._id, course: courseId });
  assert(enrollment, 404, 'Không tìm thấy ghi danh.', 'NOT_FOUND');
  enrollment.status = 'cancelled'; enrollment.completedAt = null;
  return enrollment.save();
}
export async function complete(user, courseId, enrollmentId) {
  await ownCourse(user, courseId);
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, course: courseId });
  assert(enrollment, 404, 'Không tìm thấy ghi danh.', 'NOT_FOUND');
  assert(enrollment.status !== 'cancelled', 409, 'Ghi danh đã bị hủy.', 'INVALID_STATE');
  enrollment.status = 'completed'; enrollment.completedAt ??= new Date();
  return enrollment.save();
}
