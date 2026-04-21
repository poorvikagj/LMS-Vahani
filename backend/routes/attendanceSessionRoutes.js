const express = require("express")
const crypto = require("crypto")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      session_id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      program_id INT NOT NULL,
      session_date DATE NOT NULL,
      duration_minutes INT NOT NULL,
      zoom_link TEXT,
      checkpoint_start_open TIMESTAMP,
      checkpoint_mid_open TIMESTAMP,
      checkpoint_end_open TIMESTAMP,
      checkpoint_window_seconds INT NOT NULL DEFAULT 60,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_checkpoints (
      checkpoint_id SERIAL PRIMARY KEY,
      session_id INT NOT NULL,
      student_id INT NOT NULL,
      checkpoint_type VARCHAR(20) NOT NULL,
      marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      token TEXT,
      UNIQUE(session_id, student_id, checkpoint_type)
    )
  `)
}

const attendanceCategory = (percentage) => {
  if (percentage >= 90) return "Excellent"
  if (percentage >= 75) return "Good"
  if (percentage < 60) return "Risk"
  return "Average"
}

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureTables()
    const result = await pool.query(
      `SELECT s.*
       FROM attendance_sessions s
       JOIN enrollments e ON e.program_id = s.program_id
       WHERE e.student_id = $1
       ORDER BY s.session_date DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch sessions" })
  }
})

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureTables()
    const result = await pool.query(
      `SELECT s.*, p.program_name
       FROM attendance_sessions s
       LEFT JOIN programs p ON p.program_id = s.program_id
       ORDER BY s.session_date DESC, s.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch attendance sessions" })
  }
})

router.get("/programs/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT program_id, program_name FROM programs ORDER BY program_name ASC"
    )
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch programs" })
  }
})

router.post("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureTables()
    const {
      title,
      program_id,
      session_date,
      session_start_time,
      duration_minutes,
      zoom_link,
      checkpoint_window_seconds
    } = req.body

    if (!title || !program_id || !session_date || !session_start_time || !duration_minutes) {
      return res.status(400).json({ error: "Missing required session fields" })
    }

    const safeDuration = Number(duration_minutes)
    if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
      return res.status(400).json({ error: "Duration must be a positive number" })
    }

    const startDateTime = new Date(`${session_date}T${session_start_time}`)
    if (Number.isNaN(startDateTime.getTime())) {
      return res.status(400).json({ error: "Invalid session start time" })
    }

    const midDateTime = new Date(startDateTime.getTime() + Math.floor(safeDuration / 2) * 60000)
    const endDateTime = new Date(startDateTime.getTime() + safeDuration * 60000)

    const result = await pool.query(
      `INSERT INTO attendance_sessions(
        title, program_id, session_date, duration_minutes, zoom_link,
        checkpoint_start_open, checkpoint_mid_open, checkpoint_end_open,
        checkpoint_window_seconds, created_by
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        title,
        program_id,
        session_date,
        safeDuration,
        zoom_link || null,
        startDateTime.toISOString(),
        midDateTime.toISOString(),
        endDateTime.toISOString(),
        checkpoint_window_seconds || 60,
        req.user.id
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to create session" })
  }
})

router.post("/:sessionId/mark", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureTables()
    const { sessionId } = req.params
    const { checkpoint_type } = req.body

    if (!["start", "mid", "end"].includes(String(checkpoint_type || "").toLowerCase())) {
      return res.status(400).json({ error: "Invalid checkpoint type" })
    }

    const sessionResult = await pool.query(
      "SELECT * FROM attendance_sessions WHERE session_id = $1 LIMIT 1",
      [sessionId]
    )

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "Session not found" })
    }

    const session = sessionResult.rows[0]
    const checkpointField = `checkpoint_${String(checkpoint_type).toLowerCase()}_open`
    const openTime = session[checkpointField]

    if (!openTime) {
      return res.status(400).json({ error: "Checkpoint timing is not configured" })
    }

    const now = new Date()
    const start = new Date(openTime)
    const end = new Date(start.getTime() + Number(session.checkpoint_window_seconds || 60) * 1000)

    if (now < start || now > end) {
      return res.status(403).json({ error: "Checkpoint window is closed" })
    }

    const result = await pool.query(
      `INSERT INTO attendance_checkpoints(session_id, student_id, checkpoint_type, token)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(session_id, student_id, checkpoint_type)
       DO UPDATE SET marked_at=CURRENT_TIMESTAMP, token=EXCLUDED.token
       RETURNING *`,
      [sessionId, req.user.id, String(checkpoint_type).toLowerCase(), crypto.randomUUID()]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to mark attendance checkpoint" })
  }
})

router.get("/analytics/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureTables()

    const result = await pool.query(`
      WITH summary AS (
        SELECT
          student_id,
          COUNT(*) FILTER (WHERE checkpoint_type = 'start') AS start_marks,
          COUNT(*) FILTER (WHERE checkpoint_type = 'mid') AS mid_marks,
          COUNT(*) FILTER (WHERE checkpoint_type = 'end') AS end_marks,
          COUNT(*)::decimal AS total_marks
        FROM attendance_checkpoints
        GROUP BY student_id
      )
      SELECT
        s.student_id,
        st.name,
        st.student_group,
        COALESCE(s.start_marks, 0) AS start_marks,
        COALESCE(s.mid_marks, 0) AS mid_marks,
        COALESCE(s.end_marks, 0) AS end_marks,
        ROUND(
          COALESCE((s.total_marks / NULLIF((
            SELECT COUNT(*) * 3 FROM attendance_sessions
          ), 0)) * 100, 0),
          2
        ) AS attendance_percentage
      FROM summary s
      JOIN students st ON st.student_id = s.student_id
      ORDER BY attendance_percentage DESC
    `)

    const rows = result.rows.map((item) => ({
      ...item,
      category: attendanceCategory(Number(item.attendance_percentage || 0))
    }))

    res.json(rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch attendance analytics" })
  }
})

module.exports = router
