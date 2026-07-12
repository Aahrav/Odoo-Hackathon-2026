import { Response, NextFunction } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { AuthRequest } from '../../middleware/auth';

export class AuditLogsController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await AuditLogsService.getAll(req.user.organizationId, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
