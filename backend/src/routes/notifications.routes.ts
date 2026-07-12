import { Router } from 'express';
import { NotificationsController } from '../modules/notifications/notifications.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', NotificationsController.getUnread);
router.patch('/read-all', NotificationsController.markAllAsRead);
router.patch('/:id/read', NotificationsController.markAsRead);

export default router;
