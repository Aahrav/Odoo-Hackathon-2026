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

  static async getFinancialReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roi = await DashboardService.getVehicleROI(req.user.organizationId);
      const fuelEfficiency = await DashboardService.getFuelEfficiency(req.user.organizationId);
      res.json({ success: true, data: { roi, fuelEfficiency } });
    } catch (error) {
      next(error);
    }
  }
}
