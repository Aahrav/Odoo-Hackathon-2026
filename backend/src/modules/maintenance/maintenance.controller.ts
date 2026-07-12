import { Response, NextFunction } from 'express';
import { MaintenanceService } from './maintenance.service';
import { AuthRequest } from '../../middleware/auth';

export class MaintenanceController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await MaintenanceService.getAll(req.query);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await MaintenanceService.getById(req.params.id);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await MaintenanceService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: log, message: 'Maintenance record opened' });
    } catch (error) {
      next(error);
    }
  }

  static async close(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await MaintenanceService.close(req.params.id, req.body);
      res.json({ success: true, data: log, message: 'Maintenance record closed' });
    } catch (error) {
      next(error);
    }
  }
}
