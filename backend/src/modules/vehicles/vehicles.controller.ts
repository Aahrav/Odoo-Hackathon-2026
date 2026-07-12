import { Response, NextFunction } from 'express';
import { VehiclesService } from './vehicles.service';
import { AuthRequest } from '../../middleware/auth';

export class VehiclesController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicles = await VehiclesService.getAll(req.query);
      res.json({ success: true, data: vehicles });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.getById(req.params.id);
      res.json({ success: true, data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: vehicle, message: 'Vehicle created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.update(req.params.id, req.body);
      res.json({ success: true, data: vehicle, message: 'Vehicle updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
