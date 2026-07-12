import { pool } from '../../config/db';

export class VehiclesService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const values: any[] = [];
    let count = 1;

    if (filters.status) {
      query += ` AND status = $${count++}`;
      values.push(filters.status);
    }
    
    // For dispatch dropdown, we only want available vehicles
    if (filters.dispatchable === 'true') {
      query += ` AND status = 'available'`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    // Check uniqueness
    const existing = await pool.query(
      'SELECT id FROM vehicles WHERE registration_number = $1 AND organization_id = $2',
      [data.registrationNumber, organizationId]
    );

    if (existing.rows.length > 0) {
      throw { statusCode: 409, code: 'VEHICLE_EXISTS', message: 'Registration number already exists' };
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        organization_id, registration_number, name, model, vehicle_type_id,
        max_load_capacity_kg, acquisition_cost, acquisition_date, region_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        organizationId,
        data.registrationNumber,
        data.name,
        data.model,
        data.vehicleTypeId || null,
        data.maxLoadCapacityKg,
        data.acquisitionCost,
        data.acquisitionDate || null,
        data.regionId || null,
        userId
      ]
    );

    return result.rows[0];
  }

  static async update(id: string, data: any) {
    // Basic dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;

    const allowedFields = ['name', 'model', 'max_load_capacity_kg', 'status'];
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${count++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'No valid fields provided for update' };
    }

    values.push(id);
    const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
    }
    return result.rows[0];
  }
}
