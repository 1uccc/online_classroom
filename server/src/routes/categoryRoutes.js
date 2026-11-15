import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validate, validateIds } from '../middlewares/validateRequest.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/categoryController.js';

const router = Router();
router.get('/', optionalAuthenticate, validate(schemas.categoryQuery, 'query'), controller.getCategories);
router.get('/:categoryId', validateIds, optionalAuthenticate, controller.getCategory);
router.post('/', authenticate, authorizeRoles('admin'), validate(schemas.category), controller.createCategory);
router.patch('/:categoryId', validateIds, authenticate, authorizeRoles('admin'), validate(schemas.categoryUpdate), controller.updateCategory);
router.delete('/:categoryId', validateIds, authenticate, authorizeRoles('admin'), controller.deleteCategory);
export default router;
