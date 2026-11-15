import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { passwordRateLimit } from '../middlewares/passwordRateLimit.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/userController.js';

const router = Router();
router.use(authenticate, authorizeRoles('admin'));
router.get('/', validate(schemas.userQuery, 'query'), controller.getUsers);
router.post('/', validate(schemas.createUser), controller.createUser);
router.get('/:userId', validateIds, controller.getUser);
router.patch('/:userId/status', validateIds, validate(schemas.userStatus), controller.updateStatus);
router.patch('/:userId/password', validateIds, passwordRateLimit, validate(schemas.resetUserPassword), controller.resetPassword);
export default router;
