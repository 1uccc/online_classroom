import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/assignmentController.js';

const router = Router({ mergeParams: true });
const teacher = authorizeRoles('teacher');
router.use(authenticate, validateIds);
router.get('/', validate(schemas.pageQuery, 'query'), controller.getAssignments);
router.get('/:assignmentId', validateIds, controller.getAssignment);
router.post('/', teacher, validate(schemas.assignmentCreate), controller.createAssignment);
router.patch('/:assignmentId', validateIds, teacher, validate(schemas.assignmentUpdate), controller.updateAssignment);
router.delete('/:assignmentId', validateIds, teacher, controller.deleteAssignment);
export default router;
