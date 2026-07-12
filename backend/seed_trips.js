require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seed() {
  try {
    const orgRes = await pool.query('SELECT id FROM organizations LIMIT 1');
    const orgId = orgRes.rows[0].id;

    const vRes = await pool.query('SELECT id FROM vehicles LIMIT 3');
    const vIds = vRes.rows.map(r => r.id);

    const dRes = await pool.query('SELECT id FROM drivers LIMIT 3');
    const dIds = dRes.rows.map(r => r.id);

    if (vIds.length < 3 || dIds.length < 3) {
      console.log('Not enough vehicles or drivers to seed');
      return;
    }

    // Insert Dispatched Trip (dispatched)
    await pool.query(`
      INSERT INTO trips (trip_code, organization_id, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
      VALUES ('TR-SEED-1', $1, 'Surat Warehouse', 'Mumbai Port', $2, $3, 1200, 280, 'dispatched')
    `, [orgId, vIds[0], dIds[0]]);

    // Update vehicle/driver to on_trip
    await pool.query("UPDATE vehicles SET status = 'on_trip' WHERE id = $1", [vIds[0]]);
    await pool.query("UPDATE drivers SET status = 'on_trip' WHERE id = $1", [dIds[0]]);

    // Insert Completed Trip
    await pool.query(`
      INSERT INTO trips (trip_code, organization_id, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, final_odometer_km, created_at)
      VALUES ('TR-SEED-2', $1, 'Delhi Hub', 'Agra Depot', $2, $3, 850, 210, 'completed', 15200, NOW() - INTERVAL '2 days')
    `, [orgId, vIds[1], dIds[1]]);

    // Insert Cancelled Trip
    await pool.query(`
      INSERT INTO trips (trip_code, organization_id, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, created_at)
      VALUES ('TR-SEED-3', $1, 'Pune Factory', 'Bangalore Outlet', $2, $3, 2000, 850, 'cancelled', NOW() - INTERVAL '1 day')
    `, [orgId, vIds[2], dIds[2]]);

    console.log('Successfully seeded trips!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
