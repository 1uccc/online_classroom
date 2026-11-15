import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/courseController.js';
import { courseEnrollmentRoutes } from './enrollmentRoutes.js';
import materialRoutes from './materialRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';

const router = Router();
const teacher = authorizeRoles('teacher');
router.get('/', validate(schemas.courseQuery, 'query'), controller.getCourses);
// Static routes precede /:courseId.
router.get('/mine', authenticate, teacher, validate(schemas.pageQuery, 'query'), controller.getMine);
router.post('/', authenticate, teacher, validate(schemas.course), controller.createCourse);
router.get('/:courseId', validateIds, optionalAuthenticate, controller.getCourse);
router.patch('/:courseId', validateIds, authenticate, teacher, validate(schemas.courseUpdate), controller.updateCourse);
router.patch('/:courseId/status', validateIds, authenticate, teacher, validate(schemas.courseStatus), controller.updateStatus);
router.delete('/:courseId', validateIds, authenticate, teacher, controller.deleteCourse);
router.use('/:courseId/enrollments', courseEnrollmentRoutes);
router.use('/:courseId/materials', materialRoutes);
router.use('/:courseId/assignments', assignmentRoutes);
export default router;
