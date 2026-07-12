import { pool } from '../config/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ORG_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  console.log('🌱 Starting Database Seeding...');
  
  try {
    // 1. Fetch Types & Regions
    const typesRes = await pool.query(`SELECT id, name FROM vehicle_types WHERE organization_id = $1`, [ORG_ID]);
    const regionsRes = await pool.query(`SELECT id, name FROM regions WHERE organization_id = $1`, [ORG_ID]);
    
    if (typesRes.rows.length === 0) {
      throw new Error('No vehicle types found. Please run initDb first.');
    }
    
    const truckId = typesRes.rows.find(t => t.name === 'Truck')?.id || typesRes.rows[0].id;
    const vanId = typesRes.rows.find(t => t.name === 'Van')?.id || typesRes.rows[0].id;
    const vadodaraId = regionsRes.rows.find(r => r.name === 'Vadodara')?.id || regionsRes.rows[0].id;
    const ahmedabadId = regionsRes.rows.find(r => r.name === 'Ahmedabad')?.id || regionsRes.rows[0].id;

    // 1.5 Clean old data
    console.log('Cleaning up old data...');
    await pool.query(`
      TRUNCATE vehicles, drivers, trips, fuel_logs, maintenance_logs, expenses CASCADE;
    `);

    // 2. Insert Users
    console.log('Inserting Users...');
    const defaultPassword = await bcrypt.hash('password123', 10);
    const userResult = await pool.query(`
      INSERT INTO users (organization_id, name, email, password_hash, role, status)
      VALUES 
      ($1, 'Alice Admin', 'admin@transitops.in', $2, 'admin', 'active'),
      ($1, 'Marcus Manager', 'manager@transitops.in', $2, 'fleet_manager', 'active'),
      ($1, 'David Driver', 'driver@transitops.in', $2, 'driver', 'active'),
      ($1, 'Mike Mechanic', 'mechanic@transitops.in', $2, 'safety_officer', 'active')
      ON CONFLICT (organization_id, email) DO NOTHING
    `, [ORG_ID, defaultPassword]);

    // 3. Insert Vehicles
    console.log('Inserting Vehicles...');
    const vehiclesData = [
      { reg: 'GJ-01-XX-1111', name: 'Alpha Truck-1', type: truckId, region: vadodaraId, cap: 5000, odo: 120000, cost: 2500000, status: 'available' },
      { reg: 'GJ-01-XX-2222', name: 'Beta Van-1', type: vanId, region: vadodaraId, cap: 1500, odo: 45000, cost: 800000, status: 'available' },
      { reg: 'GJ-02-YY-3333', name: 'Gamma Truck-2', type: truckId, region: ahmedabadId, cap: 8000, odo: 89000, cost: 3200000, status: 'available' },
      { reg: 'GJ-02-YY-4444', name: 'Delta Van-2', type: vanId, region: ahmedabadId, cap: 1500, odo: 12000, cost: 850000, status: 'available' },
      { reg: 'GJ-01-ZZ-5555', name: 'Echo Truck-3', type: truckId, region: vadodaraId, cap: 10000, odo: 210000, cost: 4000000, status: 'in_shop' },
    ];
    
    const vehicleIds = [];
    for (const v of vehiclesData) {
      const res = await pool.query(`
        INSERT INTO vehicles (organization_id, registration_number, name, vehicle_type_id, region_id, max_load_capacity_kg, odometer_km, acquisition_cost, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [ORG_ID, v.reg, v.name, v.type, v.region, v.cap, v.odo, v.cost, v.status]);
      vehicleIds.push(res.rows[0].id);
    }

    // 4. Insert Drivers
    console.log('Inserting Drivers...');
    const driversData = [
      { name: 'Suresh Kumar', lic: 'DL-111', cat: 'HMV', exp: '2028-10-10', score: 95.5 },
      { name: 'Ramesh Singh', lic: 'DL-222', cat: 'LMV', exp: '2027-05-15', score: 88.0 },
      { name: 'Vikram Patel', lic: 'DL-333', cat: 'HMV', exp: '2029-01-20', score: 99.0 },
      { name: 'Arjun Desai', lic: 'DL-444', cat: 'LMV', exp: '2026-08-11', score: 92.5 },
    ];
    
    const driverIds = [];
    for (const d of driversData) {
      const res = await pool.query(`
        INSERT INTO drivers (organization_id, name, license_number, license_category, license_expiry_date, safety_score, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'available')
        RETURNING id
      `, [ORG_ID, d.name, d.lic, d.cat, d.exp, d.score]);
      driverIds.push(res.rows[0].id);
    }

    // 5. Insert Completed Trips (to populate Analytics Revenue & Distance)
    console.log('Inserting Trips & Fuel Logs for Analytics...');
    const tripSources = ['Vadodara Hub', 'Ahmedabad Depot', 'Surat Facility', 'Rajkot Center'];
    const tripDestinations = ['Mumbai Port', 'Delhi Warehouse', 'Pune Logistics', 'Indore Hub'];
    
    for (let i = 0; i < 30; i++) {
      const vId = vehicleIds[i % vehicleIds.length];
      const dId = driverIds[i % driverIds.length];
      const distance = Math.floor(Math.random() * 500) + 100; // 100 to 600 km
      const revenue = distance * 100 + (Math.floor(Math.random() * 2000) * 5); // Example revenue math
      
      const tripRes = await pool.query(`
        INSERT INTO trips (
          organization_id, trip_code, source, destination, vehicle_id, driver_id, 
          cargo_weight_kg, planned_distance_km, actual_distance_km, status,
          start_odometer_km, final_odometer_km, fuel_consumed_l, revenue
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', 0, $9, $10, $11
        ) RETURNING id
      `, [
        ORG_ID, 
        `TRP-SEED-${i}`, 
        tripSources[i % 4], 
        tripDestinations[i % 4], 
        vId, 
        dId,
        1000, 
        distance, 
        distance, 
        distance / (6 + Math.random() * 6), // Random efficiency between 6 and 12 km/l
        revenue
      ]);

      // 6. Insert Fuel Logs for the trip
      const fuelLiters = distance / (6 + Math.random() * 6);
      await pool.query(`
        INSERT INTO fuel_logs (organization_id, vehicle_id, trip_id, liters, cost_per_liter)
        VALUES ($1, $2, $3, $4, 95.50)
      `, [ORG_ID, vId, tripRes.rows[0].id, fuelLiters]);

      // 7. Random Maintenance & Expenses
      if (i % 3 === 0) {
        await pool.query(`
          INSERT INTO maintenance_logs (organization_id, vehicle_id, maintenance_type, description, status, cost)
          VALUES ($1, $2, 'oil_change', 'Routine Oil Change', 'closed', $3)
        `, [ORG_ID, vId, 2500 + Math.random() * 1000]);
      }
      
      if (i % 5 === 0) {
        await pool.query(`
          INSERT INTO expenses (organization_id, vehicle_id, trip_id, expense_type, amount, description)
          VALUES ($1, $2, $3, 'toll', $4, 'Highway Toll')
        `, [ORG_ID, vId, tripRes.rows[0].id, 500 + Math.random() * 500]);
      }
    }

    console.log('✅ Seeding completed successfully!');
    
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
