import { Client } from 'pg';

const requiredVariables = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
const missingVariables = requiredVariables.filter(name => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Missing database environment variables: ${missingVariables.join(', ')}`);
}

const portValue = process.env.PGPORT === undefined ? '5432' : process.env.PGPORT;
const port = Number(portValue);
if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PGPORT must be an integer between 1 and 65535');
}

const dbConn = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port,
});

export default dbConn;
