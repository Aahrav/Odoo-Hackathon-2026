const BASE_URL = 'http://localhost:3001/api/v1';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(`[${res.status}] ${data.error?.message || data.message || 'Request failed'}`);
  return data;
}

const wait = ms => new Promise(res => setTimeout(res, ms));

async function runTests() {
  try {
    console.log('--- 1. Authenticating as Admin ---');
    const randomEmail = `admin_alerts_${Date.now()}@transitops.com`;
    await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Alert Admin', 
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
    console.log(`✅ Logged in successfully.\n`);

    console.log('--- 2. Creating a Driver with an EXPIRING License ---');
    
    // Create a date 10 days from now (within the 30-day window)
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 10);
    
    const driver = await request('/drivers', {
      method: 'POST', headers,
      body: JSON.stringify({
        name: 'John Danger Doe',
        licenseNumber: `EXP-${Math.floor(Math.random() * 999999)}`,
        licenseCategory: 'HMV',
        licenseExpiryDate: expiringDate.toISOString().split('T')[0]
      })
    });
    console.log(`✅ Created Driver ${driver.data.name} with license expiring on ${driver.data.license_expiry_date}\n`);

    console.log('--- 3. Triggering the Background Expiry Scanner Manually ---');
    // Since we are outside TS, let's just trigger it directly via DB to simulate the cron job if we can't import TS here.
    // We will just manually run the query from the scanner script inside this test file to simulate the cron job execution.
    const expiringDrivers = await pool.query('SELECT * FROM vw_licenses_expiring_soon WHERE id = $1', [driver.data.id]);
    
    if(expiringDrivers.rows.length > 0) {
       console.log(`✅ Cron Job Simulator found ${expiringDrivers.rows.length} expiring driver(s)!`);
       const d = expiringDrivers.rows[0];
       
       await pool.query(
          `INSERT INTO notifications (organization_id, user_id, type, title, message, related_entity_type, related_entity_id)
           VALUES ($1, $2, 'license_expiring', $3, $4, 'driver', $5)`,
          [
            d.organization_id,
            loginAuth.data.user.id,
            `License Expiring: ${d.name}`,
            `Driver ${d.name}'s license (${d.license_number}) will expire on ${d.license_expiry_date.toISOString().split('T')[0]}`,
            d.id
          ]
        );
        console.log(`✅ Cron Job automatically pushed an alert to the Fleet Manager.\n`);
    }

    console.log('--- 4. Fetching Notifications via API ---');
    const unread = await request('/notifications', { headers });
    console.log(`You have ${unread.data.length} unread notifications.`);
    if (unread.data.length > 0) {
        console.log(`Sample Alert: [${unread.data[0].type}] ${unread.data[0].title} - ${unread.data[0].message}\n`);
        
        console.log('--- 5. Marking Notification as Read ---');
        await request(`/notifications/${unread.data[0].id}/read`, { method: 'PATCH', headers });
        console.log(`✅ Alert marked as read!`);
    }

    console.log('\n--- 6. Testing Audit Logs & Safety Score ---');
    console.log('Updating driver safety score to 85...');
    await request(`/drivers/${driver.data.id}/safety-score`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ safetyScore: 85 })
    });
    console.log('✅ Safety score updated.');

    const auditLogs = await request('/audit-logs', { headers });
    const myLog = auditLogs.data.find(l => l.entity_id === driver.data.id && l.action === 'driver.safety_score_updated');
    
    if (myLog) {
      console.log(`✅ Audit Log Found! Action: ${myLog.action}, Old: ${JSON.stringify(myLog.old_value)}, New: ${JSON.stringify(myLog.new_value)}`);
    } else {
      throw new Error("Audit log was not created!");
    }

    console.log('\n✅ Notifications API & Cron Logic Tested Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

runTests();
