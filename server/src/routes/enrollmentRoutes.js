import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import { pageQuery } from '../validators/schemas.js';
import * as controller from '../controllers/enrollmentController.js';

export const courseEnrollmentRoutes = Router({ mergeParams: true });
courseEnrollmentRoutes.use(authenticate, validateIds);
courseEnrollmentRoutes.post('/', authorizeRoles('student'), controller.enroll);
courseEnrollmentRoutes.get('/', authorizeRoles('teacher'), validate(pageQuery, 'query'), controller.getStudents);
courseEnrollmentRoutes.patch('/me/cancel', authorizeRoles('student'), controller.cancel);
courseEnrollmentRoutes.patch('/:enrollmentId/complete', validateIds, authorizeRoles('teacher'), controller.complete);

const router = Router();
router.get('/me', authenticate, authorizeRoles('student'), validate(pageQuery, 'query'), controller.getMine);
export default router;
