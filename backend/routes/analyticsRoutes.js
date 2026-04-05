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

router.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [hasStudents, hasEnrollments, hasPrograms] = await Promise.all([
      tableExists("students"),
      tableExists("enrollments"),
      tableExists("programs")
    ])

    if (!hasStudents) {
      return res.json({
        students: [],
        batches: [],
        totalStudents: 0
      })
    }

    if (!hasEnrollments || !hasPrograms) {
      const baseStudents = await pool.query(
        `SELECT student_id, name, email, batch
         FROM students
         ORDER BY name`
      )

      const rows = baseStudents.rows.map((student) => ({
        student_id: Number(student.student_id),
        name: student.name,
        email: student.email,
        batch: student.batch,
        enrolled_programs: 0,
        total_classes_planned: 0,
        classes_attended: 0,
        attendance_percentage: 0,
        total_assignments: 0,
        assignments_submitted: 0,
        submission_rate: 0,
        avg_submission_score: 0,
        performance_score: 0
      }))

      const batchSet = [...new Set(rows.map((item) => item.batch).filter((item) => item !== null))]

      return res.json({
        students: rows,
        batches: batchSet.sort((a, b) => Number(a) - Number(b)),
        totalStudents: rows.length
      })
    }

    const { search = "", batch = "all", program_id = "all" } = req.query
    const values = []
    const studentFilters = []

    if (search && String(search).trim()) {
      values.push(`%${String(search).trim()}%`)
      const idx = values.length
      studentFilters.push(`(s.name ILIKE $${idx} OR s.email ILIKE $${idx})`)
    }

    if (batch !== "all") {
      const batchNumber = Number(batch)
      if (!Number.isNaN(batchNumber)) {
        values.push(batchNumber)
        studentFilters.push(`s.batch = $${values.length}`)
      }
    }

    let programFilterPlaceholder = null
    let enrollmentJoinType = "LEFT JOIN"
    let enrollmentProgramFilter = ""

    if (program_id !== "all") {
      const programIdNumber = Number(program_id)
      if (!Number.isNaN(programIdNumber)) {
        values.push(programIdNumber)
        programFilterPlaceholder = values.length
        enrollmentJoinType = "JOIN"
        enrollmentProgramFilter = `AND e.program_id = $${programFilterPlaceholder}`
      }
    }

    const studentWhereClause = studentFilters.length ? `WHERE ${studentFilters.join(" AND ")}` : ""

    const result = await pool.query(
      `WITH filtered_students AS (
        SELECT s.student_id, s.name, s.email, s.batch
        FROM students s
        ${studentWhereClause}
      ),
      student_programs AS (
        SELECT fs.student_id, fs.name, fs.email, fs.batch, e.program_id
        FROM filtered_students fs
        ${enrollmentJoinType} enrollments e
          ON e.student_id = fs.student_id
          ${enrollmentProgramFilter}
      ),
      attendance_agg AS (
        SELECT
          student_id,
          program_id,
          COUNT(*) FILTER (WHERE status = 'Present') AS present_classes
        FROM attendance
        GROUP BY student_id, program_id
      ),
      assignment_totals AS (
        SELECT
          program_id,
          COUNT(*) AS total_assignments
        FROM assignments
        GROUP BY program_id
      ),
      submission_agg AS (
        SELECT
          s.student_id,
          a.program_id,
          COUNT(*) FILTER (WHERE s.status = 'Submitted') AS assignments_submitted,
          AVG(s.score) FILTER (
            WHERE s.status = 'Submitted'
            AND s.score IS NOT NULL
          ) AS avg_submission_score
        FROM submissions s
        JOIN assignments a ON a.assignment_id = s.assignment_id
        GROUP BY s.student_id, a.program_id
      )
      SELECT
        sp.student_id,
        sp.name,
        sp.email,
        sp.batch,
        COUNT(DISTINCT sp.program_id) FILTER (WHERE sp.program_id IS NOT NULL) AS enrolled_programs,
        COALESCE(SUM(p.total_class), 0) AS total_classes_planned,
        COALESCE(SUM(att.present_classes), 0) AS classes_attended,
        COALESCE(SUM(ass.total_assignments), 0) AS total_assignments,
        COALESCE(SUM(sub.assignments_submitted), 0) AS assignments_submitted,
        COALESCE(
          AVG(sub.avg_submission_score) FILTER (WHERE sub.avg_submission_score IS NOT NULL),
          0
        ) AS avg_submission_score
      FROM student_programs sp
      LEFT JOIN programs p ON p.program_id = sp.program_id
      LEFT JOIN attendance_agg att
        ON att.student_id = sp.student_id
        AND att.program_id = sp.program_id
      LEFT JOIN assignment_totals ass
        ON ass.program_id = sp.program_id
      LEFT JOIN submission_agg sub
        ON sub.student_id = sp.student_id
        AND sub.program_id = sp.program_id
      GROUP BY sp.student_id, sp.name, sp.email, sp.batch
      ORDER BY sp.name`,
      values
    )

    const rows = result.rows.map((student) => {
      const totalClasses = Number(student.total_classes_planned || 0)
      const classesAttended = Number(student.classes_attended || 0)
      const totalAssignments = Number(student.total_assignments || 0)
      const submittedAssignments = Number(student.assignments_submitted || 0)
      const avgScore = Number(student.avg_submission_score || 0)

      const attendancePercentage = totalClasses
        ? Number(((classesAttended * 100) / totalClasses).toFixed(2))
        : 0

      const submissionRate = totalAssignments
        ? Number(((submittedAssignments * 100) / totalAssignments).toFixed(2))
        : 0

      const performanceScore = Number(
        (attendancePercentage * 0.4 + submissionRate * 0.35 + avgScore * 0.25).toFixed(2)
      )

      return {
        student_id: Number(student.student_id),
        name: student.name,
        email: student.email,
        batch: student.batch,
        enrolled_programs: Number(student.enrolled_programs || 0),
        total_classes_planned: totalClasses,
        classes_attended: classesAttended,
        attendance_percentage: attendancePercentage,
        total_assignments: totalAssignments,
        assignments_submitted: submittedAssignments,
        submission_rate: submissionRate,
        avg_submission_score: Number(avgScore.toFixed(2)),
        performance_score: performanceScore
      }
    })

    const batchSet = [...new Set(rows.map((item) => item.batch).filter((item) => item !== null))]

    res.json({
      students: rows,
      batches: batchSet.sort((a, b) => Number(a) - Number(b)),
      totalStudents: rows.length
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Student analytics fetch failed" })
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