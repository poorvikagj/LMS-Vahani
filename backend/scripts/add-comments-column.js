// Migration: Add comments column to submissions table
const { pool } = require("./db")

async function addCommentsColumn() {
    try {
        // Check if comments column exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='submissions' AND column_name='comments'
        `)

        if (checkResult.rows.length > 0) {
            console.log("✅ Comments column already exists")
            return
        }

        // Add comments column if it doesn't exist
        await pool.query(`
            ALTER TABLE submissions
            ADD COLUMN comments TEXT
        `)

        console.log("✅ Comments column added successfully")
    } catch (err) {
        console.error("❌ Migration failed:", err)
    }
}

// Run migration
addCommentsColumn().then(() => process.exit(0))
