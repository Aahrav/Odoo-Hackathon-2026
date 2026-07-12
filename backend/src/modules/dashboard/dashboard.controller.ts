import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth';

export class DashboardController {
  static async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getOverview(req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getVehicleROI(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getVehicleROI(req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getFuelEfficiency(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getFuelEfficiency(req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
