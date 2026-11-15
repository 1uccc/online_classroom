import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validateRequest.js';
import * as schemas from '../validators/schemas.js';
import * as controller from '../controllers/authController.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần thử. Vui lòng thử lại sau.', code: 'RATE_LIMITED' } });
router.post('/register', limiter, validate(schemas.register), controller.register);
router.post('/login', limiter, validate(schemas.login), controller.login);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate(schemas.profile), controller.updateMe);
export default router;
