import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: 'db',
  database: process.env.POSTGRES_DB || 'timetracker',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  port: 5432
});

export default pool;
