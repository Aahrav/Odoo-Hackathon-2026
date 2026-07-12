import { Router } from 'express';
import { ChatController } from '../modules/chat/chat.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Protect the chat endpoint
router.use(authenticateJWT);

router.post('/', ChatController.sendMessage);

export default router;
