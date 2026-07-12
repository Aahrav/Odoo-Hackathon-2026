import { pool } from '../../config/db';

export class DriversService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const values: any[] = [];
    let count = 1;

    if (filters.status) {
      query += ` AND status = $${count++}`;
      values.push(filters.status);
    }
    
    // For dispatch dropdown, we only want available drivers with valid licenses
    if (filters.dispatchable === 'true') {
      query += ` AND status = 'available' AND license_expiry_date >= CURRENT_DATE`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Driver not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    const existing = await pool.query(
      'SELECT id FROM drivers WHERE license_number = $1 AND organization_id = $2',
      [data.licenseNumber, organizationId]
    );

    if (existing.rows.length > 0) {
      throw { statusCode: 409, code: 'DRIVER_EXISTS', message: 'License number already exists' };
    }

    const result = await pool.query(
      `INSERT INTO drivers (
        organization_id, user_id, name, license_number, license_category,
        license_expiry_date, contact_number, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        organizationId,
        data.userId || null,
        data.name,
        data.licenseNumber,
        data.licenseCategory,
        data.licenseExpiryDate,
        data.contactNumber || null,
        userId
      ]
    );

    return result.rows[0];
  }

  static async update(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;

    const allowedFields = ['name', 'license_category', 'license_expiry_date', 'contact_number', 'status'];
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
    const query = `UPDATE drivers SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Driver not found' };
    }
    return result.rows[0];
  }

  static async updateSafetyScore(id: string, safetyScore: number, userId: string, organizationId: string) {
    const oldDriver = await this.getById(id);
    const result = await pool.query(
      `UPDATE drivers SET safety_score = $1 WHERE id = $2 RETURNING *`,
      [safetyScore, id]
    );
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Driver not found' };
    }
    
    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        organizationId,
        userId,
        'driver.safety_score_updated',
        'driver',
        id,
        JSON.stringify({ safety_score: oldDriver.safety_score }),
        JSON.stringify({ safety_score: safetyScore })
      ]
    );
    
    return result.rows[0];
  }
}
