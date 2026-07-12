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
    await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test Admin', 
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
    console.log(`Login successful as ${randomEmail}!\n`);

    console.log('--- 2. Creating a Vehicle for Testing ---');
    const vehicle = await request('/vehicles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        registrationNumber: `GJ-02-CD-${Math.floor(Math.random() * 9999)}`,
        name: 'Test Maintenance Van',
        model: 'Tata Ace',
        maxLoadCapacityKg: 2000,
        acquisitionCost: 800000
      })
    });
    console.log(`Vehicle created: ${vehicle.id}\n`);

    console.log('--- 3. Opening a Maintenance Log ---');
    const mLog = await request('/maintenance', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vehicleId: vehicle.id,
        maintenanceType: 'oil_change',
        description: 'Routine oil change'
      })
    });
    console.log(`Maintenance log opened: ${mLog.id} (Status: ${mLog.status})\n`);

    console.log('--- 4. Verifying Vehicle is in_shop ---');
    const vCheck = await request(`/vehicles/${vehicle.id}`, { headers });
    console.log(`Vehicle status is now: ${vCheck.status}\n`);
    if (vCheck.status !== 'in_shop') throw new Error('Vehicle is not in_shop!');

    console.log('--- 5. Closing the Maintenance Log ---');
    const closedLog = await request(`/maintenance/${mLog.id}/close`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ cost: 1500.50 })
    });
    console.log(`Maintenance log closed! (Status: ${closedLog.status}, Cost: ${closedLog.cost})\n`);

    console.log('--- 6. Verifying Vehicle is available again ---');
    const vCheck2 = await request(`/vehicles/${vehicle.id}`, { headers });
    console.log(`Vehicle status is now: ${vCheck2.status}\n`);
    if (vCheck2.status !== 'available') throw new Error('Vehicle did not become available!');

    console.log('--- 7. Logging Fuel ---');
    const fuelLog = await request('/fuel', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vehicleId: vehicle.id,
        liters: 50.5,
        costPerLiter: 100
      })
    });
    console.log(`Fuel logged: ${fuelLog.liters} liters (Total Cost auto-generated: ${fuelLog.total_cost})\n`);

    console.log('✅ Maintenance and Fuel Tests Passed Successfully!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

runTests();
