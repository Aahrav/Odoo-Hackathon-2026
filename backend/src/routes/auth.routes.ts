import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
