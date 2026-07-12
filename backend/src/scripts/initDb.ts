import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

async function initDB() {
  try {
    console.log('Connecting to database...');
    
    // Read the SQL file from the root directory
    const sqlFilePath = path.join(__dirname, '../../../sql file');
    console.log(`Reading SQL from: ${sqlFilePath}`);
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL script...');
    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDB();
