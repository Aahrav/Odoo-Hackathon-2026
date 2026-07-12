import { Response, NextFunction } from 'express';
import { FuelService } from './fuel.service';
import { AuthRequest } from '../../middleware/auth';

export class FuelController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await FuelService.getAll(req.query);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await FuelService.getById(req.params.id);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await FuelService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: log, message: 'Fuel record added' });
    } catch (error) {
      next(error);
    }
  }
}
