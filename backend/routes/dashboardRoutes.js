const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

// Get dashboard stats
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const programsResult = await pool.query("SELECT COUNT(*) as count FROM programs")
        const studentsResult = await pool.query("SELECT COUNT(*) as count FROM students")
        const enrollmentsResult = await pool.query("SELECT COUNT(*) as count FROM enrollments")

        res.json({
            ongoingPrograms: parseInt(programsResult.rows[0].count),
            totalStudents: parseInt(studentsResult.rows[0].count),
            totalEnrollments: parseInt(enrollmentsResult.rows[0].count)
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

// Get program analytics
router.get("/analytics", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.program_name, COUNT(e.student_id) as enrolled
            FROM programs p
            LEFT JOIN enrollments e ON p.program_id = e.program_id
            GROUP BY p.program_id, p.program_name
        `)
        res.json(result.rows)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

module.exports = router