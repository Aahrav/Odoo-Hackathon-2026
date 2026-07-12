import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth';
import { pool } from '../../config/db';

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

  static async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, report } = req.query;
      
      if (type !== 'csv') {
        return res.status(400).json({ success: false, error: { message: 'Only csv type is supported for export' } });
      }

      if (report !== 'operational-cost') {
        return res.status(400).json({ success: false, error: { message: 'Unknown report type' } });
      }

      // Fetch operational cost from DB
      const result = await pool.query(
        'SELECT registration_number, total_fuel_cost, total_maintenance_cost, total_other_expenses, total_operational_cost FROM vw_vehicle_operational_cost WHERE vehicle_id IN (SELECT id FROM vehicles WHERE organization_id = $1)',
        [req.user.organizationId]
      );

      const fastcsv = require('fast-csv');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="operational-cost-report.csv"');

      const csvStream = fastcsv.format({ headers: true });
      csvStream.pipe(res);

      result.rows.forEach(row => {
        csvStream.write(row);
      });
      
      csvStream.end();

    } catch (error) {
      next(error);
    }
  }
}
