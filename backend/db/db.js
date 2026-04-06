const { Pool } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

const isProduction = process.env.NODE_ENV === "production"

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  })
  : new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: isProduction ? { rejectUnauthorized: false } : false
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
