import { Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { AuthRequest } from '../../middleware/auth';

export class NotificationsController {
  static async getUnread(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationsService.getUnread(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationsService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, data, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationsService.markAllAsRead(req.user.id);
      res.json({ success: true, data, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
