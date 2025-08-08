import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Only test connection if DATABASE_URL is provided
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://placeholder:placeholder@placeholder:5432/placeholder?sslmode=require') {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Connected to Neon database successfully!');
      release();
    }
  });
}

export default pool; 