const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {

    const result = await pool.query(`
    
    SELECT 
        p.program_id,
        p.program_name,
        p.total_class,

        -- enrollments
        COUNT(DISTINCT e.student_id) AS total_students,

        -- classes completed (max class_no marked)
        COALESCE(MAX(att.class_no), 0) AS classes_completed,

        -- avg attendance %
        ROUND(
          AVG(
            CASE 
              WHEN att.status = 'Present' THEN 100.0 
              ELSE 0 
            END
          ), 2
        ) AS avg_attendance_percentage,

        -- assignments
        COUNT(DISTINCT ass.assignment_id) AS total_assignments,

        -- submission rate
        ROUND(
          (COUNT(DISTINCT sub.submission_id) FILTER (WHERE sub.status='Submitted') * 100.0)
          / NULLIF(COUNT(DISTINCT ass.assignment_id) * COUNT(DISTINCT e.student_id), 0),
        2) AS overall_submission_rate

    FROM programs p

    LEFT JOIN enrollments e 
      ON e.program_id = p.program_id

    LEFT JOIN attendance att 
      ON att.program_id = p.program_id

    LEFT JOIN assignments ass 
      ON ass.program_id = p.program_id

    LEFT JOIN submissions sub 
      ON sub.assignment_id = ass.assignment_id

    GROUP BY p.program_id, p.program_name, p.total_class
    ORDER BY p.program_name

    `)

    res.json(result.rows)

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Analytics fetch failed" })
  }
})

module.exports = router