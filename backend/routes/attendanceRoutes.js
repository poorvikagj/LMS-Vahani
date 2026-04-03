const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

// MARK ATTENDANCE
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
    const { student_id, class_id, status } = req.body
    try {
        const result = await pool.query(
            `INSERT INTO attendance(student_id,class_id,status) VALUES($1,$2,$3) RETURNING *`,
            [student_id, class_id, status]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }
})


// GET ATTENDANCE
router.get("/", verifyToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM attendance")
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }

})

// POST /attendance/save
router.post("/save", async (req, res) => {
    const { program_id, data } = req.body

    try {
        for (let record of data) {
            const { student_id, class_no, status } = record

            await pool.query(`
                INSERT INTO attendance (student_id, program_id, class_no, status)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (student_id, program_id, class_no)
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    marked_at = CURRENT_TIMESTAMP
            `, [student_id, program_id, class_no, status])
        }

        res.json({ message: "Attendance updated successfully" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Save failed" })
    }
})

module.exports = router