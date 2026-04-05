const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
const { Pool } = require("pg")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const cleanEnvValue = (value) => {
  if (typeof value !== "string") return value
  return value.replace(/^"|"$/g, "")
}

const run = async () => {
  const sqlPath = path.join(__dirname, "..", "db", "schema.sql")
  const sql = fs.readFileSync(sqlPath, "utf8")
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)

  const pool = new Pool({
    user: cleanEnvValue(process.env.DB_USER) || "postgres",
    host: cleanEnvValue(process.env.DB_HOST) || "localhost",
    database: cleanEnvValue(process.env.DB_NAME) || "postgres",
    password: cleanEnvValue(process.env.DB_PASSWORD),
    port: Number(cleanEnvValue(process.env.DB_PORT) || 5432)
  })

  try {
    let applied = 0
    let skipped = 0

    for (const statement of statements) {
      try {
        await pool.query(statement)
        applied += 1
      } catch (error) {
        if (error.message && error.message.toLowerCase().includes("already exists")) {
          skipped += 1
          continue
        }
        throw error
      }
    }

    console.log(`schema.sql processed successfully (applied: ${applied}, skipped existing: ${skipped})`)
    process.exitCode = 0
  } catch (error) {
    console.error("schema.sql execution failed:", error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

run()
