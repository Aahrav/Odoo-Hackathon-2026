import { pool } from '../../config/db';

export class FuelService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM fuel_logs WHERE 1=1';
    const values: any[] = [];
    let count = 1;

    if (filters.vehicleId) {
      query += ` AND vehicle_id = $${count++}`;
      values.push(filters.vehicleId);
    }
    if (filters.tripId) {
      query += ` AND trip_id = $${count++}`;
      values.push(filters.tripId);
    }

    query += ' ORDER BY log_date DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM fuel_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Fuel log not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    // Basic verification of vehicle
    const vResult = await pool.query('SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2', [data.vehicleId, organizationId]);
    if (vResult.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
    }

    const result = await pool.query(
      `INSERT INTO fuel_logs (
        organization_id, vehicle_id, trip_id, liters, cost_per_liter, odometer_km, log_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        organizationId,
        data.vehicleId,
        data.tripId || null,
        data.liters,
        data.costPerLiter,
        data.odometerKm || null,
        data.logDate || new Date().toISOString().split('T')[0],
        userId
      ]
    );

    return result.rows[0];
  }
}
