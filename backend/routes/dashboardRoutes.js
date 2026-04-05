const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const tableExists = async (tableName) => {
    const result = await pool.query("SELECT to_regclass($1) AS regclass", [`public.${tableName}`])
    return Boolean(result.rows[0]?.regclass)
}

// Get dashboard stats
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [hasPrograms, hasStudents, hasEnrollments, hasSubmissions] = await Promise.all([
            tableExists("programs"),
            tableExists("students"),
            tableExists("enrollments"),
            tableExists("submissions")
        ])

        if (!hasPrograms || !hasStudents || !hasEnrollments || !hasSubmissions) {
            return res.json({
                ongoingPrograms: 0,
                totalStudents: 0,
                totalEnrollments: 0,
                pendingReviews: 0
            })
        }

        const programsResult = await pool.query("SELECT COUNT(*) as count FROM programs")
        const studentsResult = await pool.query("SELECT COUNT(*) as count FROM students")
        const enrollmentsResult = await pool.query("SELECT COUNT(*) as count FROM enrollments")
        const pendingReviewsResult = await pool.query("SELECT COUNT(*) FROM submissions WHERE status = 'Submitted' AND score IS NULL")
        res.json({
            ongoingPrograms: parseInt(programsResult.rows[0].count),
            totalStudents: parseInt(studentsResult.rows[0].count),
            totalEnrollments: parseInt(enrollmentsResult.rows[0].count),
            pendingReviews: parseInt(pendingReviewsResult.rows[0].count)
        })
        
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

// Get program analytics
router.get("/analytics", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [hasPrograms, hasEnrollments] = await Promise.all([
            tableExists("programs"),
            tableExists("enrollments")
        ])

        if (!hasPrograms || !hasEnrollments) {
            return res.json([])
        }

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