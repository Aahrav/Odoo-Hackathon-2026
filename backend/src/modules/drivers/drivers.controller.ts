import { Response, NextFunction } from 'express';
import { DriversService } from './drivers.service';
import { AuthRequest } from '../../middleware/auth';

export class DriversController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const drivers = await DriversService.getAll(req.query);
      res.json({ success: true, data: drivers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.getById(req.params.id);
      res.json({ success: true, data: driver });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: driver, message: 'Driver created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.update(req.params.id, req.body);
      res.json({ success: true, data: driver, message: 'Driver updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateSafetyScore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.updateSafetyScore(req.params.id, req.body.safetyScore);
      res.json({ success: true, data: driver, message: 'Safety score updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
