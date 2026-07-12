import { pool } from '../../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export class AuthService {
  static async signup(data: any) {
    const { name, email, password, role, organizationId } = data;

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw { statusCode: 409, code: 'USER_EXISTS', message: 'Email is already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [organizationId, name, email, hashedPassword, role]
    );

    return result.rows[0];
  }

  static async login(email: string, password: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw { statusCode: 401, code: 'AUTH_FAILED', message: 'Invalid credentials' };
    }

    if (user.status !== 'active') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'User account is suspended or inactive' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw { statusCode: 401, code: 'AUTH_FAILED', message: 'Invalid credentials' };
    }

    await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  static async getMe(userId: string) {
    const result = await pool.query('SELECT id, name, email, role, status, organization_id FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'User not found' };
    }
    return result.rows[0];
  }
}
