const { Pool } = require("pg");
require("dotenv").config();

// SSL should only be enabled when connecting to AWS RDS (production/remote host)
const isLocal =
  process.env.DB_HOST === "db" ||
  process.env.DB_HOST === "localhost" ||
  process.env.DB_HOST === "127.0.0.1";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
