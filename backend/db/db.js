const { Pool } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000
})

const connect = async () => {
  try {
    await pool.connect()
    console.log("PostgreSQL Connected")
  } catch (err) {
    console.error(err)
  }
}

module.exports = { pool, connect }

// sudo -u postgres psql -d lms_portal -f ./backend/db/schema.sql
// sudo -u postgres psql
