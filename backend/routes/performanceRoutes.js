const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")

router.get("/performance", verifyToken, async (req, res) => {
    const student_id = req.user.id   // from JWT

    try {

        const result = await pool.query(`
            SELECT 
            p.program_id,
            p.program_name,

            COALESCE(ass.total_assignments, 0) AS total_assignments,
            COALESCE(sub.assignments_completed, 0) AS assignments_completed,
            COALESCE(sub.avg_submission_score, 0) AS avg_submission_score,
            COALESCE(att.attendance_percentage, 0) AS attendance_percentage,

            ROUND(
                (
                    COALESCE(
                        (sub.assignments_completed::decimal / NULLIF(ass.total_assignments, 0)) * 100,
                        0
                    ) * 0.6
                )
                +
                (COALESCE(att.attendance_percentage, 0) * 0.4)
            ) AS score

        FROM enrollments e
        JOIN programs p ON e.program_id = p.program_id

        LEFT JOIN (
            SELECT
                program_id,
                COUNT(*) AS total_assignments
            FROM assignments
            GROUP BY program_id
        ) ass ON ass.program_id = p.program_id

        LEFT JOIN (
            SELECT
                a.program_id,
                s.student_id,
                COUNT(*) FILTER (WHERE s.status = 'Submitted') AS assignments_completed,
                ROUND(
                    AVG(s.score) FILTER (
                        WHERE s.status = 'Submitted'
                        AND s.score IS NOT NULL
                    ),
                    2
                ) AS avg_submission_score
            FROM submissions s
            JOIN assignments a ON a.assignment_id = s.assignment_id
            WHERE s.student_id = $1
            GROUP BY a.program_id, s.student_id
        ) sub ON sub.program_id = p.program_id AND sub.student_id = e.student_id

        LEFT JOIN (
            SELECT
                student_id,
                program_id,
                ROUND(
                    AVG(
                        CASE
                            WHEN status = 'Present' THEN 100.0
                            ELSE 0
                        END
                    ),
                    2
                ) AS attendance_percentage
            FROM attendance
            GROUP BY student_id, program_id
        ) att ON att.program_id = p.program_id AND att.student_id = e.student_id

        WHERE e.student_id = $1

        GROUP BY
            p.program_id,
            p.program_name,
            ass.total_assignments,
            sub.assignments_completed,
            sub.avg_submission_score,
            att.attendance_percentage
        ORDER BY p.program_name
        `, [student_id])

        res.json(result.rows)

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Failed to fetch performance" })

    }

})

module.exports = router