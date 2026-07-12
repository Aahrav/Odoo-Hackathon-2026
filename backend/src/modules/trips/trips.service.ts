import { pool } from '../../config/db';

export class TripsService {
  static async getAll(filters: any) {
    let query = 'SELECT * FROM trips WHERE 1=1';
    const values: any[] = [];
    let count = 1;

    if (filters.status) {
      query += ` AND status = $${count++}`;
      values.push(filters.status);
    }
    if (filters.vehicleId) {
      query += ` AND vehicle_id = $${count++}`;
      values.push(filters.vehicleId);
    }
    if (filters.driverId) {
      query += ` AND driver_id = $${count++}`;
      values.push(filters.driverId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Trip not found' };
    }
    return result.rows[0];
  }

  static async create(data: any, userId: string, organizationId: string) {
    // Pre-check vehicle capacity
    const vResult = await pool.query(
      'SELECT max_load_capacity_kg FROM vehicles WHERE id = $1 AND organization_id = $2',
      [data.vehicleId, organizationId]
    );
    if (vResult.rows.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vehicle not found' };
    }
    if (data.cargoWeightKg > vResult.rows[0].max_load_capacity_kg) {
      throw {
        statusCode: 422,
        code: 'OVERWEIGHT',
        message: `Cargo weight (${data.cargoWeightKg}kg) exceeds vehicle capacity of ${vResult.rows[0].max_load_capacity_kg}kg`
      };
    }

    const tripCode = `TRP-${Date.now().toString().slice(-6)}`;

    const result = await pool.query(
      `INSERT INTO trips (
        organization_id, trip_code, source, destination, vehicle_id, driver_id,
        cargo_weight_kg, planned_distance_km, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        organizationId,
        tripCode,
        data.source,
        data.destination,
        data.vehicleId,
        data.driverId,
        data.cargoWeightKg,
        data.plannedDistanceKm,
        userId
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, data: any) {
    const trip = await this.getById(id);
    if (trip.status !== 'draft') {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Only draft trips can be edited directly' };
    }

    const fields: string[] = [];
    const values: any[] = [];
    let count = 1;

    const allowedFields = ['source', 'destination', 'vehicle_id', 'driver_id', 'cargo_weight_kg', 'planned_distance_km'];
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
    const query = `UPDATE trips SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err: any) {
      if (err.message && err.message.includes('exceeds vehicle max load capacity')) {
        throw { statusCode: 422, code: 'OVERWEIGHT', message: err.message };
      }
      throw err;
    }
  }

  static async dispatch(id: string, userId: string) {
    const trip = await this.getById(id);
    if (trip.status !== 'draft') {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Only draft trips can be dispatched' };
    }

    // Pre-checks for vehicle and driver
    const vResult = await pool.query('SELECT status FROM vehicles WHERE id = $1', [trip.vehicle_id]);
    if (vResult.rows[0].status !== 'available') {
      throw { statusCode: 400, code: 'VEHICLE_UNAVAILABLE', message: `Vehicle is currently ${vResult.rows[0].status}` };
    }

    const dResult = await pool.query('SELECT status, license_expiry_date FROM drivers WHERE id = $1', [trip.driver_id]);
    if (dResult.rows[0].status !== 'available') {
      throw { statusCode: 400, code: 'DRIVER_UNAVAILABLE', message: `Driver is currently ${dResult.rows[0].status}` };
    }
    
    if (new Date(dResult.rows[0].license_expiry_date) < new Date()) {
      throw { statusCode: 400, code: 'LICENSE_EXPIRED', message: 'Driver license is expired' };
    }

    const result = await pool.query(`UPDATE trips SET status = 'dispatched' WHERE id = $1 RETURNING *`, [id]);
    
    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_value) VALUES ($1, $2, $3, $4, $5, $6)`,
      [trip.organization_id, userId, 'trip.dispatched', 'trip', id, JSON.stringify(result.rows[0])]
    );

    return result.rows[0];
  }

  static async complete(id: string, data: any, userId: string) {
    const trip = await this.getById(id);
    if (trip.status !== 'dispatched') {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Only dispatched trips can be completed' };
    }

    const { finalOdometerKm, fuelConsumedL, revenue } = data;
    if (!finalOdometerKm || finalOdometerKm < trip.start_odometer_km) {
        throw { statusCode: 400, code: 'INVALID_ODOMETER', message: 'Final odometer must be greater than or equal to start odometer' };
    }

    const actualDistance = finalOdometerKm - trip.start_odometer_km;

    const result = await pool.query(
      `UPDATE trips 
       SET status = 'completed', 
           final_odometer_km = $1, 
           fuel_consumed_l = $2, 
           revenue = COALESCE($3, 0),
           actual_distance_km = $4
       WHERE id = $5 RETURNING *`,
      [finalOdometerKm, fuelConsumedL || null, revenue || 0, actualDistance, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_value) VALUES ($1, $2, $3, $4, $5, $6)`,
      [trip.organization_id, userId, 'trip.completed', 'trip', id, JSON.stringify(result.rows[0])]
    );

    return result.rows[0];
  }

  static async cancel(id: string, userId: string) {
    const trip = await this.getById(id);
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Cannot cancel a completed or already cancelled trip' };
    }

    const result = await pool.query(`UPDATE trips SET status = 'cancelled' WHERE id = $1 RETURNING *`, [id]);
    
    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_value) VALUES ($1, $2, $3, $4, $5, $6)`,
      [trip.organization_id, userId, 'trip.cancelled', 'trip', id, JSON.stringify(result.rows[0])]
    );

    return result.rows[0];
  }
}
