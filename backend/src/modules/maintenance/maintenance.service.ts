import { pool } from '../../config/db';

export class MaintenanceService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM maintenance_logs WHERE 1=1';
    const values: any[] = [];
    let count = 1;

    if (filters.vehicleId) {
      query += ` AND vehicle_id = $${count++}`;
      values.push(filters.vehicleId);
    }
    if (filters.status) {
      query += ` AND status = $${count++}`;
      values.push(filters.status);
    }

    query += ' ORDER BY opened_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM maintenance_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Maintenance log not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    // Check if vehicle exists
    const vResult = await pool.query('SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2', [data.vehicleId, organizationId]);
    if (vResult.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
    }

    // Creating a log with 'open' status triggers the DB to set the vehicle to 'in_shop'
    const result = await pool.query(
      `INSERT INTO maintenance_logs (
        organization_id, vehicle_id, maintenance_type, description, vendor_name, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        organizationId,
        data.vehicleId,
        data.maintenanceType,
        data.description || null,
        data.vendorName || null,
        userId
      ]
    );
    return result.rows[0];
  }

  static async close(id: string, data: any) {
    const log = await this.getById(id);
    if (log.status === 'closed') {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Maintenance log is already closed' };
    }

    // Updating status to 'closed' triggers the DB to set vehicle to 'available'
    const result = await pool.query(
      `UPDATE maintenance_logs SET status = 'closed', cost = COALESCE($1, 0.0) WHERE id = $2 RETURNING *`,
      [data.cost, id]
    );
    return result.rows[0];
  }
}
