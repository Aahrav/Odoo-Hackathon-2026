const BASE_URL = 'http://localhost:3001/api/v1';

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`[${res.status}] ${data.error?.message || data.message || 'Request failed'}`);
  return data.data;
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function runTests() {
  try {
    console.log('--- 1. Authenticating ---');
    const randomEmail = `admin_e2e_${Date.now()}@transitops.com`;
    await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Admin E2E', 
        email: randomEmail, 
        password: 'password123', 
        role: 'admin',
        organizationId: '00000000-0000-0000-0000-000000000001'
      })
    });
    const loginAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'password123' })
    });
    const headers = { Authorization: `Bearer ${loginAuth.accessToken}` };
    console.log(`✅ Authenticated successfully.\n`);

    console.log('--- 2. Setting Up Resources ---');
    const vehicle = await request('/vehicles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        registrationNumber: `E2E-MH-${Math.floor(Math.random() * 9999)}`,
        name: 'E2E Logistics Truck',
        model: 'Ashok Leyland',
        maxLoadCapacityKg: 5000,
        acquisitionCost: 1000000
      })
    });
    
    // Future Date for License
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const driver = await request('/drivers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'E2E Pro Driver',
        licenseNumber: `DL-E2E-${Math.floor(Math.random() * 999999)}`,
        licenseCategory: 'HMV',
        licenseExpiryDate: futureDate.toISOString().split('T')[0]
      })
    });
    console.log(`✅ Created Vehicle (ID: ${vehicle.registrationNumber}, Cost: 1,000,000) and Driver.\n`);

    console.log('--- 3. Executing Trip 1 (Distance: 300km, Revenue: 10000) ---');
    const trip1 = await request('/trips', {
      method: 'POST', headers,
      body: JSON.stringify({
        source: 'Mumbai', destination: 'Pune',
        vehicleId: vehicle.id, driverId: driver.id,
        cargoWeightKg: 2000, plannedDistanceKm: 300
      })
    });
    await request(`/trips/${trip1.id}/dispatch`, { method: 'POST', headers });
    await request(`/trips/${trip1.id}/complete`, { 
        method: 'POST', headers, 
        body: JSON.stringify({ finalOdometerKm: 300, revenue: 10000 }) 
    });
    console.log(`✅ Trip 1 Completed.\n`);

    console.log('--- 4. Executing Trip 2 (Distance: 200km, Revenue: 5000) ---');
    const trip2 = await request('/trips', {
      method: 'POST', headers,
      body: JSON.stringify({
        source: 'Pune', destination: 'Nashik',
        vehicleId: vehicle.id, driverId: driver.id,
        cargoWeightKg: 3000, plannedDistanceKm: 200
      })
    });
    await request(`/trips/${trip2.id}/dispatch`, { method: 'POST', headers });
    await request(`/trips/${trip2.id}/complete`, { 
        method: 'POST', headers, 
        body: JSON.stringify({ finalOdometerKm: 500, revenue: 5000 }) 
    });
    console.log(`✅ Trip 2 Completed (Total Odometer: 500km).\n`);

    console.log('--- 5. Performing Maintenance (Cost: 3000) ---');
    const mLog = await request('/maintenance', {
      method: 'POST', headers,
      body: JSON.stringify({ vehicleId: vehicle.id, maintenanceType: 'brake_service' })
    });
    await request(`/maintenance/${mLog.id}/close`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ cost: 3000 })
    });
    console.log(`✅ Maintenance closed.\n`);

    console.log('--- 6. Logging Fuel (100 Liters @ 100/L = Cost: 10000) ---');
    await request('/fuel', {
      method: 'POST', headers,
      body: JSON.stringify({ vehicleId: vehicle.id, liters: 100, costPerLiter: 100 })
    });
    console.log(`✅ Fuel logged.\n`);

    console.log('--- 7. Fetching Financial Reports ---');
    const financials = await request('/reports/roi', { headers });
    
    const myVehicleRoi = financials.roi.find(v => v.vehicle_id === vehicle.id);
    const myVehicleFuel = financials.fuelEfficiency.find(v => v.vehicle_id === vehicle.id);

    console.log('📊 FINANCIAL SUMMARY FOR E2E TRUCK:');
    console.log(`Total Distance Driven: ${myVehicleFuel.total_distance_km} km`);
    console.log(`Total Fuel Consumed: ${myVehicleFuel.total_fuel_liters} L`);
    console.log(`--> FUEL EFFICIENCY: ${myVehicleFuel.km_per_liter} km/l\n`);

    console.log(`Total Revenue: ₹${myVehicleRoi.total_revenue}`);
    console.log(`Maintenance Cost: ₹${myVehicleRoi.total_maintenance_cost}`);
    console.log(`Fuel Cost: ₹${myVehicleRoi.total_fuel_cost}`);
    console.log(`--> NET ROI: ${myVehicleRoi.roi} (Profit / Acquisition Cost)\n`);

    console.log('✅ End-to-End Test Passed!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

runTests();
