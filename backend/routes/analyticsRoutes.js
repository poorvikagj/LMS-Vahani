const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const tableExists = async (tableName) => {
  const result = await pool.query("SELECT to_regclass($1) AS regclass", [`public.${tableName}`])
  return Boolean(result.rows[0]?.regclass)
}

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {

    const [hasPrograms, hasEnrollments, hasAttendance, hasAssignments, hasSubmissions] = await Promise.all([
      tableExists("programs"),
      tableExists("enrollments"),
      tableExists("attendance"),
      tableExists("assignments"),
      tableExists("submissions")
    ])

    if (!hasPrograms) {
      return res.json([])
    }

    // Base fallback when assignment/submission tables are not available yet.
    if (!hasEnrollments || !hasAttendance) {
      const baseResult = await pool.query(`
        SELECT
          p.program_id,
          p.program_name,
          p.total_class,
          0::int AS total_students,
          0::int AS classes_completed,
          0::numeric AS avg_attendance_percentage,
          0::int AS total_assignments,
          0::numeric AS overall_submission_rate
        FROM programs p
        ORDER BY p.program_name
      `)

      return res.json(baseResult.rows)
    }

    if (!hasAssignments || !hasSubmissions) {
      const partialResult = await pool.query(`
        SELECT
          p.program_id,
          p.program_name,
          p.total_class,
          COUNT(DISTINCT e.student_id) AS total_students,
          COALESCE(MAX(att.class_no), 0) AS classes_completed,
          COALESCE(
            ROUND(
              AVG(CASE WHEN att.status = 'Present' THEN 100.0 ELSE 0 END),
              2
            ),
            0
          ) AS avg_attendance_percentage,
          0::int AS total_assignments,
          0::numeric AS overall_submission_rate
        FROM programs p
        LEFT JOIN enrollments e ON e.program_id = p.program_id
        LEFT JOIN attendance att ON att.program_id = p.program_id
        GROUP BY p.program_id, p.program_name, p.total_class
        ORDER BY p.program_name
      `)

      return res.json(partialResult.rows)
    }

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

// Power BI attendance dataset (flat rows for reporting tools)
router.get("/powerbi/attendance", async (req, res) => {
  try {
    const [hasAttendance, hasStudents, hasPrograms] = await Promise.all([
      tableExists("attendance"),
      tableExists("students"),
      tableExists("programs")
    ])

    if (!hasAttendance || !hasStudents || !hasPrograms) {
      return res.json([])
    }

    const { program_id, batch } = req.query

    const filters = []
    const values = []

    if (program_id) {
      values.push(Number(program_id))
      filters.push(`a.program_id = $${values.length}`)
    }

    if (batch) {
      values.push(Number(batch))
      filters.push(`s.batch = $${values.length}`)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

    const result = await pool.query(
      `SELECT
        a.student_id,
        s.name AS student_name,
        s.email AS student_email,
        s.batch,
        a.program_id,
        p.program_name,
        a.class_no,
        a.status,
        a.marked_at,
        CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END AS present_flag
      FROM attendance a
      JOIN students s ON s.student_id = a.student_id
      JOIN programs p ON p.program_id = a.program_id
      ${whereClause}
      ORDER BY p.program_name, s.batch, s.name, a.class_no`,
      values
    )

    res.json(result.rows)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Power BI attendance fetch failed" })
  }
})

module.exports = router