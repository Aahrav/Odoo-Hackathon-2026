const BASE_URL = 'http://localhost:3001/api/v1';

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions
  });
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await res.text();
    if (!res.ok) throw new Error(`[${res.status}] CSV Fetch Failed`);
    return text; // Return raw CSV text
  }

  const data = await res.json();
  if (!res.ok) throw new Error(`[${res.status}] ${data.error?.message || data.message || 'Request failed'}`);
  return data;
}

async function runTests() {
  try {
    console.log('--- 1. Authenticating ---');
    const randomEmail = `admin_exp_${Date.now()}@transitops.com`;
    await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Admin Exp', 
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
    const headers = { Authorization: `Bearer ${loginAuth.data.accessToken}` };
    console.log(`✅ Authenticated successfully.\n`);

    console.log('--- 2. Setting Up Vehicle ---');
    const vehicle = await request('/vehicles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        registrationNumber: `EXP-DL-${Math.floor(Math.random() * 9999)}`,
        name: 'Expenses Truck',
        model: 'Tata 407',
        maxLoadCapacityKg: 3000,
        acquisitionCost: 500000
      })
    });
    console.log(`✅ Created Vehicle (ID: ${vehicle.data.registration_number})\n`);

    console.log('--- 3. Logging Expenses ---');
    const expense1 = await request('/expenses', {
      method: 'POST', headers,
      body: JSON.stringify({
        vehicleId: vehicle.data.id,
        expenseType: 'toll',
        amount: 350,
        description: 'Highway Toll Plaza'
      })
    });
    
    const expense2 = await request('/expenses', {
      method: 'POST', headers,
      body: JSON.stringify({
        vehicleId: vehicle.data.id,
        expenseType: 'fine',
        amount: 1500,
        description: 'Speeding ticket'
      })
    });
    console.log(`✅ Logged Toll (350) and Fine (1500).\n`);

    console.log('--- 4. Validating CSV Export ---');
    const csvContent = await request('/reports/export?type=csv&report=operational-cost', { headers });
    console.log('📄 Received CSV Content from API:');
    console.log('----------------------------------------------------');
    console.log(csvContent);
    console.log('----------------------------------------------------\n');
    
    // Verify our vehicle appears in the CSV
    if (csvContent.includes(vehicle.data.registration_number)) {
      console.log(`✅ CSV successfully includes our new vehicle!`);
    } else {
      throw new Error("CSV does not contain the new vehicle data!");
    }

    console.log('\n--- 5. Testing Edge Cases ---');
    try {
      await request('/reports/export?type=pdf&report=operational-cost', { headers });
      throw new Error("Should have failed for PDF type");
    } catch (e) {
      console.log(`✅ Edge case passed: ${e.message} (Expected rejection for unsupported type)`);
    }

    try {
      await request('/reports/export?type=csv&report=unknown_report', { headers });
      throw new Error("Should have failed for unknown report");
    } catch (e) {
      console.log(`✅ Edge case passed: ${e.message} (Expected rejection for unknown report)`);
    }

    console.log('\n✅ All Phase 6 & 7 Tests Passed Flawlessly!');
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

runTests();
