import { pool } from '../../config/db';

export class DashboardService {
  static async getFleetKPIs(organizationId: string) {
    const result = await pool.query('SELECT * FROM vw_dashboard_kpis WHERE organization_id = $1', [organizationId]);
    return result.rows[0] || { active_vehicles: 0, available_vehicles: 0, vehicles_in_maintenance: 0 };
  }

  static async getTripKPIs(organizationId: string) {
    const result = await pool.query('SELECT * FROM vw_dashboard_trip_kpis WHERE organization_id = $1', [organizationId]);
    return result.rows[0] || { active_trips: 0, pending_trips: 0 };
  }

  static async getDriverKPIs(organizationId: string) {
    const result = await pool.query('SELECT * FROM vw_dashboard_driver_kpis WHERE organization_id = $1', [organizationId]);
    return result.rows[0] || { drivers_on_duty: 0 };
  }

  static async getFleetUtilization(organizationId: string) {
    const result = await pool.query('SELECT * FROM vw_fleet_utilization WHERE organization_id = $1', [organizationId]);
    return result.rows[0] || { utilization_pct: 0 };
  }

  static async getVehicleROI(organizationId: string) {
    const result = await pool.query(
      'SELECT * FROM vw_vehicle_roi WHERE vehicle_id IN (SELECT id FROM vehicles WHERE organization_id = $1)',
      [organizationId]
    );
    return result.rows;
  }

  static async getFuelEfficiency(organizationId: string) {
    const result = await pool.query(
      'SELECT * FROM vw_fuel_efficiency WHERE vehicle_id IN (SELECT id FROM vehicles WHERE organization_id = $1)',
      [organizationId]
    );
    return result.rows;
  }

  static async getOverview(organizationId: string) {
    const [fleet, trips, drivers, utilization] = await Promise.all([
      this.getFleetKPIs(organizationId),
      this.getTripKPIs(organizationId),
      this.getDriverKPIs(organizationId),
      this.getFleetUtilization(organizationId)
    ]);
    
    return {
      fleet,
      trips,
      drivers,
      utilization
    };
  }
}
