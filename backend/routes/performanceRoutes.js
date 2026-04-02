const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")

router.get("/performance", verifyToken, async (req, res) => {
    const student_id = req.user.id   // from JWT

    try {

        const result = await pool.query(`
            SELECT 
            p.program_name,

            COUNT(DISTINCT a.assignment_id) AS total_assignments,
            COUNT(DISTINCT s.submission_id) AS assignments_completed,

            0 AS total_tests,
            0 AS tests_completed,

            ROUND(
                (COUNT(DISTINCT s.submission_id)::decimal 
                / NULLIF(COUNT(DISTINCT a.assignment_id), 0)) * 100
            ) AS score

        FROM enrollments e
        JOIN programs p ON e.program_id = p.program_id

        LEFT JOIN assignments a ON p.program_id = a.program_id
        LEFT JOIN submissions s 
            ON a.assignment_id = s.assignment_id 
            AND s.student_id = $1

        WHERE e.student_id = $1

        GROUP BY p.program_name
        `, [student_id])

        res.json(result.rows)

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Failed to fetch performance" })

    }

})

module.exports = router