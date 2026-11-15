import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import { submissionUpload } from '../middlewares/upload.js';
import { findAssignment, canSubmit } from '../services/accessService.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/submissionController.js';

const student = authorizeRoles('student');
const teacher = authorizeRoles('teacher');
// Refuse unauthorized uploads before buffering their bodies.
const eligible = async (req, res, next) => { await canSubmit(req.user, await findAssignment(req.params.assignmentId)); next(); };
export const assignmentSubmissionRoutes = Router({ mergeParams: true });
assignmentSubmissionRoutes.use(authenticate, validateIds);
assignmentSubmissionRoutes.post('/', student, eligible, submissionUpload, validate(schemas.submission), controller.createSubmission);
assignmentSubmissionRoutes.get('/me', student, controller.getMine);
assignmentSubmissionRoutes.put('/me', student, eligible, submissionUpload, validate(schemas.submission), controller.replaceMine);
assignmentSubmissionRoutes.get('/', teacher, validate(schemas.pageQuery, 'query'), controller.getSubmissions);

const router = Router();
router.use(authenticate);
router.get('/:submissionId', validateIds, controller.getSubmission);
router.get('/:submissionId/attachments/:attachmentId/download', validateIds, controller.downloadAttachment);
router.patch('/:submissionId/grade', validateIds, teacher, validate(schemas.grade), controller.grade);
export default router;
