import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ChatService } from './chat.service';

export class ChatController {
  static async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ success: false, error: { message: 'Message is required' } });
      }

      // Organization ID injected by auth middleware
      const orgId = req.user.organizationId;
      
      const reply = await ChatService.generateResponse(message, orgId);
      
      res.json({
        success: true,
        data: {
          reply
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
