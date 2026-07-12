import cron from 'node-cron';
import { pool } from '../config/db';

export function startExpiryScanner() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('--- Running Expiry Scanner Cron Job ---');
    try {
      // 1. Scan for expiring driver licenses (via vw_licenses_expiring_soon)
      const expiringDrivers = await pool.query('SELECT * FROM vw_licenses_expiring_soon');
      
      for (const driver of expiringDrivers.rows) {
        // We alert fleet_managers in that organization
        const managers = await pool.query(
          "SELECT id FROM users WHERE organization_id = $1 AND role IN ('admin', 'fleet_manager')", 
          [driver.organization_id]
        );
        
        for (const manager of managers.rows) {
          // Check if notification already exists today to avoid spamming
          const exists = await pool.query(
            "SELECT id FROM notifications WHERE user_id = $1 AND related_entity_id = $2 AND type = 'license_expiring' AND created_at >= CURRENT_DATE",
            [manager.id, driver.id]
          );
          
          if (exists.rows.length === 0) {
            await pool.query(
              `INSERT INTO notifications (organization_id, user_id, type, title, message, related_entity_type, related_entity_id)
               VALUES ($1, $2, 'license_expiring', $3, $4, 'driver', $5)`,
              [
                driver.organization_id,
                manager.id,
                `License Expiring: ${driver.name}`,
                `Driver ${driver.name}'s license (${driver.license_number}) will expire on ${driver.license_expiry_date}`,
                driver.id
              ]
            );
          }
        }
      }
      
      console.log(`Scanner complete: found ${expiringDrivers.rows.length} expiring licenses.`);
    } catch (error) {
      console.error('Error in expiry scanner:', error);
    }
  });
}
