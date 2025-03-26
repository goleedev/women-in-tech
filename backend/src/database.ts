import { Pool } from 'pg';
import { config } from 'dotenv';

// Set up the env variables
config();

// Set up the connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Set up this to false to bypass the SSL verification
    rejectUnauthorized: false,
  },
});

export default pool;
