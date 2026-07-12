import { pool } from '../../config/db';

export class NotificationsService {
  static async getUnread(userId: string) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async markAsRead(id: string, userId: string) {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Notification not found' };
    }
    return result.rows[0];
  }

  static async markAllAsRead(userId: string) {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = now() WHERE user_id = $1 AND is_read = false RETURNING id',
      [userId]
    );
    return { updatedCount: result.rows.length };
  }
}
