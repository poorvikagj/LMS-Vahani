const { Pool } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "lms_portal",
  password: process.env.DB_PASSWORD,
  port: 5432
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
