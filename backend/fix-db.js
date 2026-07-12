require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixView() {
  try {
    await pool.query(`
      CREATE OR REPLACE VIEW vw_fuel_efficiency AS
      SELECT 
          v.id AS vehicle_id,
          COALESCE(t_sum.total_distance, 0) AS total_distance_km,
          COALESCE(f_sum.total_liters, 0) AS total_fuel_liters,
          ROUND(COALESCE(t_sum.total_distance, 0) / NULLIF(f_sum.total_liters, 0), 2) AS km_per_liter
      FROM vehicles v
      LEFT JOIN (
          SELECT vehicle_id, SUM(actual_distance_km) as total_distance
          FROM trips
          WHERE status = 'completed'
          GROUP BY vehicle_id
      ) t_sum ON t_sum.vehicle_id = v.id
      LEFT JOIN (
          SELECT vehicle_id, SUM(liters) as total_liters
          FROM fuel_logs
          GROUP BY vehicle_id
      ) f_sum ON f_sum.vehicle_id = v.id
      WHERE t_sum.total_distance > 0 OR f_sum.total_liters > 0;
    `);
    console.log('✅ Fuel Efficiency View Updated Successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixView();
