import { pool } from '../../config/db';

export class ExpensesService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM expenses WHERE 1=1';
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
    if (filters.type) {
      query += ` AND expense_type = $${count++}`;
      values.push(filters.type);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Expense not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    // Optional check for vehicle existence
    if (data.vehicleId) {
      const vResult = await pool.query('SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2', [data.vehicleId, organizationId]);
      if (vResult.rows.length === 0) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
      }
    }

    const result = await pool.query(
      `INSERT INTO expenses (
        organization_id, vehicle_id, trip_id, expense_type, amount, description, expense_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        organizationId,
        data.vehicleId || null,
        data.tripId || null,
        data.expenseType,
        data.amount,
        data.description || null,
        data.expenseDate || new Date().toISOString().split('T')[0],
        userId
      ]
    );

    return result.rows[0];
  }

  static async update(id: string, data: any) {
    const expense = await this.getById(id);

    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;

    const allowedFields = ['expense_type', 'amount', 'description', 'expense_date'];
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
    const query = `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: string) {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Expense not found' };
    }
    return result.rows[0];
  }
}
