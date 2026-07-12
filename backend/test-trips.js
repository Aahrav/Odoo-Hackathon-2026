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

async function runTests() {
  try {
    console.log('--- 1. Signing up a Test Admin ---');
    const randomEmail = `admin_${Date.now()}@transitops.com`;
    const auth = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test Admin', 
        email: randomEmail, 
        password: 'password123', 
        role: 'admin',
        organizationId: '00000000-0000-0000-0000-000000000001'
      })
    });
    // Now login to get the token
    const loginAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'password123' })
    });
    const token = loginAuth.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log(`Signup & Login successful as ${randomEmail}!\n`);

    console.log('--- 2. Creating a Vehicle ---');
    const vehicle = await request('/vehicles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        registrationNumber: `GJ-01-AB-${Math.floor(Math.random() * 9999)}`,
        name: 'Test Truck',
        model: 'Tata Ace',
        maxLoadCapacityKg: 2000,
        acquisitionCost: 800000
      })
    });
    console.log(`Vehicle created: ${vehicle.name} (Capacity: 2000kg)\n`);

    console.log('--- 3. Creating a Driver ---');
    // Ensure future expiry
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const driver = await request('/drivers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'John Doe',
        licenseNumber: `DL-${Math.floor(Math.random() * 999999)}`,
        licenseCategory: 'HMV',
        licenseExpiryDate: futureDate.toISOString().split('T')[0]
      })
    });
    console.log(`Driver created: ${driver.name}\n`);

    console.log('--- 4. Creating a Trip (Draft) ---');
    const trip = await request('/trips', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'Warehouse A',
        destination: 'Client X',
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeightKg: 1500,
        plannedDistanceKm: 120
      })
    });
    console.log(`Trip created: ${trip.trip_code} (Status: ${trip.status})\n`);

    console.log('--- 5. Dispatching the Trip ---');
    const dispatchedTrip = await request(`/trips/${trip.id}/dispatch`, {
      method: 'POST',
      headers
    });
    console.log(`Trip dispatched! (Status: ${dispatchedTrip.status})\n`);

    console.log('--- 6. Verifying Vehicle Lock ---');
    const vCheck = await request(`/vehicles/${vehicle.id}`, { headers });
    console.log(`Vehicle status is now: ${vCheck.status}\n`);

    console.log('--- 7. Completing the Trip ---');
    const completedTrip = await request(`/trips/${trip.id}/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        finalOdometerKm: 120, // 0 + 120
        fuelConsumedL: 10,
        revenue: 5000
      })
    });
    console.log(`Trip completed! (Status: ${completedTrip.status}, Distance: ${completedTrip.actual_distance_km}km)\n`);

    console.log('--- 8. Verifying Vehicle Unlock ---');
    const vCheck2 = await request(`/vehicles/${vehicle.id}`, { headers });
    console.log(`Vehicle status is now back to: ${vCheck2.status}, Odometer: ${vCheck2.odometer_km}km\n`);

    console.log('✅ All Tests Passed Successfully!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

runTests();
