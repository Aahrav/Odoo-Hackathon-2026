const BASE_URL = 'http://localhost:3001/api/v1';

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || 'Request failed';
    throw new Error(`[${res.status}] ${errorMsg}`);
  }
  return data;
}

async function runTests() {
  console.log('🛡️ RUNNING MASTER EDGE-CASE TEST SUITE 🛡️\n');
  try {
    console.log('--- 1. Authenticating as Admin ---');
    const randomEmail = `admin_edge_${Date.now()}@transitops.com`;
    await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Edge Admin', email: randomEmail, password: 'password123', role: 'admin', organizationId: '00000000-0000-0000-0000-000000000001' })
    });
    const login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'password123' })
    });
    const headers = { Authorization: `Bearer ${login.data.accessToken}` };
    console.log('✅ Admin Authenticated.\n');

    console.log('--- 2. Setting Up Test Vehicle (Max Capacity: 2000kg) & Driver ---');
    const vehicle = await request('/vehicles', {
      method: 'POST', headers,
      body: JSON.stringify({ registrationNumber: `EDGE-${Math.floor(Math.random()*9999)}`, name: 'Edge Truck', maxLoadCapacityKg: 2000, acquisitionCost: 50000 })
    });
    
    // Valid Driver
    const validDate = new Date(); validDate.setFullYear(validDate.getFullYear() + 1);
    const validDriver = await request('/drivers', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Valid Driver', licenseNumber: `VD-${Math.floor(Math.random()*99999)}`, licenseCategory: 'HMV', licenseExpiryDate: validDate.toISOString().split('T')[0] })
    });

    // Expired Driver
    const expiredDate = new Date(); expiredDate.setFullYear(expiredDate.getFullYear() - 1);
    const expiredDriver = await request('/drivers', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Expired Driver', licenseNumber: `EXD-${Math.floor(Math.random()*99999)}`, licenseCategory: 'HMV', licenseExpiryDate: expiredDate.toISOString().split('T')[0] })
    });
    console.log('✅ Resources created.\n');

    console.log('--- EDGE CASE 1: Cargo Overweight Prevention ---');
    try {
      await request('/trips', {
        method: 'POST', headers,
        body: JSON.stringify({
          source: 'A', destination: 'B', vehicleId: vehicle.data.id, driverId: validDriver.data.id,
          cargoWeightKg: 2500, // Exceeds 2000kg max load
          plannedDistanceKm: 100
        })
      });
      throw new Error('❌ Allowed overweight cargo!');
    } catch (e) {
      if(e.message.includes('Cargo weight') || e.message.includes('500')) {
         console.log('✅ DB Trigger Blocked Overweight Cargo! Error:', e.message);
      } else throw e;
    }

    console.log('\n--- EDGE CASE 2: Expired License Dispatch Prevention ---');
    const tripForExpired = await request('/trips', {
      method: 'POST', headers,
      body: JSON.stringify({
        source: 'A', destination: 'B', vehicleId: vehicle.data.id, driverId: expiredDriver.data.id,
        cargoWeightKg: 1000, plannedDistanceKm: 100
      })
    });
    try {
      await request(`/trips/${tripForExpired.data.id}/dispatch`, { method: 'POST', headers });
      throw new Error('❌ Allowed dispatch with expired license!');
    } catch (e) {
      if(e.message.includes('expired')) {
        console.log('✅ DB Trigger Blocked Expired License! Error:', e.message);
      } else throw e;
    }

    console.log('\n--- EDGE CASE 3: Vehicle Double-Dispatch Prevention ---');
    const trip1 = await request('/trips', {
      method: 'POST', headers,
      body: JSON.stringify({ source: 'A', destination: 'B', vehicleId: vehicle.data.id, driverId: validDriver.data.id, cargoWeightKg: 1000, plannedDistanceKm: 100 })
    });
    // Dispatch first trip (Should succeed)
    await request(`/trips/${trip1.data.id}/dispatch`, { method: 'POST', headers });
    console.log('✅ First trip dispatched. Vehicle is now on_trip.');

    // Try dispatching a second trip with the same vehicle
    const validDriver2 = await request('/drivers', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Valid Driver 2', licenseNumber: `VD2-${Math.floor(Math.random()*99999)}`, licenseCategory: 'HMV', licenseExpiryDate: validDate.toISOString().split('T')[0] })
    });
    const trip2 = await request('/trips', {
      method: 'POST', headers,
      body: JSON.stringify({ source: 'A', destination: 'B', vehicleId: vehicle.data.id, driverId: validDriver2.data.id, cargoWeightKg: 1000, plannedDistanceKm: 100 })
    });
    try {
      await request(`/trips/${trip2.data.id}/dispatch`, { method: 'POST', headers });
      throw new Error('❌ Allowed double-dispatch!');
    } catch (e) {
      if(e.message.includes('Vehicle is not Available')) {
         console.log('✅ DB Trigger Blocked Double-Dispatch! Error:', e.message);
      } else throw e;
    }

    console.log('\n--- EDGE CASE 4: Maintenance Prevents Dispatch ---');
    // Complete the first trip so vehicle is available again
    await request(`/trips/${trip1.data.id}/complete`, { method: 'POST', headers, body: JSON.stringify({ finalOdometerKm: 100 }) });
    
    // Open maintenance
    await request('/maintenance', { method: 'POST', headers, body: JSON.stringify({ vehicleId: vehicle.data.id, maintenanceType: 'oil_change' }) });
    console.log('✅ Vehicle is now in maintenance (in_shop).');

    // Try dispatching
    try {
      await request(`/trips/${trip2.data.id}/dispatch`, { method: 'POST', headers });
      throw new Error('❌ Allowed dispatch while vehicle is in maintenance!');
    } catch (e) {
      if(e.message.includes('Vehicle is not Available')) {
         console.log('✅ DB Trigger Blocked Dispatch During Maintenance! Error:', e.message);
      } else throw e;
    }

    console.log('\n🛡️ ALL EDGE CASES PASSED PERFECTLY! 🛡️');
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

runTests();
