import { pool } from '../../config/db';

export class AuditLogsService {
  static async getAll(organizationId: string, filters: any) {
    let query = 'SELECT * FROM audit_logs WHERE organization_id = $1';
    const values: any[] = [organizationId];
    let count = 2;

    if (filters.entityType) {
      query += ` AND entity_type = $${count++}`;
      values.push(filters.entityType);
    }
    if (filters.entityId) {
      query += ` AND entity_id = $${count++}`;
      values.push(filters.entityId);
    }
    if (filters.userId) {
      query += ` AND user_id = $${count++}`;
      values.push(filters.userId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100'; // Hardcoded limit for demo

    const result = await pool.query(query, values);
    return result.rows;
  }
}
