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
        name: 'Dashboard Admin', 
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

    console.log('--- 2. Testing Part 1: Operational KPIs (/reports/kpis) ---');
    const overview = await request('/reports/kpis', { headers });
    console.log(`Fleet KPIs: Active: ${overview.fleet.active_vehicles}, Available: ${overview.fleet.available_vehicles}`);
    console.log(`Trip KPIs: Active: ${overview.trips.active_trips}, Pending: ${overview.trips.pending_trips}`);
    console.log(`Fleet Utilization: ${overview.utilization.utilization_pct}%\n`);

    console.log('--- 3. Testing Part 2: Financial Reports (/reports/roi) ---');
    const financials = await request('/reports/roi', { headers });
    console.log(`Retrieved ROI data for ${financials.roi.length} vehicles.`);
    if (financials.roi.length > 0) {
      console.log(`Sample ROI: Vehicle ${financials.roi[0].registration_number} -> ROI: ${financials.roi[0].roi}`);
    }
    
    console.log(`Retrieved Fuel Efficiency data for ${financials.fuelEfficiency.length} vehicles.`);
    if (financials.fuelEfficiency.length > 0) {
        console.log(`Sample Fuel Efficiency: Vehicle ${financials.fuelEfficiency[0].vehicle_id} -> ${financials.fuelEfficiency[0].km_per_liter} km/l\n`);
    }

    console.log('✅ Reports APIs Tested Successfully! The km/l issue should now be fixed!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

runTests();
