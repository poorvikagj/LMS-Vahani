const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")

const ensureGamificationTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gamification_profiles (
      profile_id SERIAL PRIMARY KEY,
      student_id INT UNIQUE NOT NULL,
      points INT NOT NULL DEFAULT 0,
      streak_days INT NOT NULL DEFAULT 0,
      badges TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      last_login_date DATE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

const getBadges = (points) => {
  const badges = []
  if (points >= 100) badges.push("Bronze")
  if (points >= 300) badges.push("Silver")
  if (points >= 600) badges.push("Gold")
  return badges
}

const upsertProfile = async (studentId) => {
  await pool.query(
    `INSERT INTO gamification_profiles(student_id)
     VALUES($1)
     ON CONFLICT(student_id) DO NOTHING`,
    [studentId]
  )
}

router.get("/leaderboard", verifyToken, async (req, res) => {
  try {
    await ensureGamificationTable()
    const result = await pool.query(`
      SELECT gp.student_id, st.name, gp.points, gp.streak_days, gp.badges
      FROM gamification_profiles gp
      JOIN students st ON st.student_id = gp.student_id
      ORDER BY gp.points DESC, gp.streak_days DESC
      LIMIT 20
    `)
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch leaderboard" })
  }
})

router.get("/me", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureGamificationTable()
    await upsertProfile(req.user.id)

    const result = await pool.query(
      `SELECT student_id, points, streak_days, badges, last_login_date
       FROM gamification_profiles
       WHERE student_id = $1
       LIMIT 1`,
      [req.user.id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
})

router.post("/award", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureGamificationTable()
    await upsertProfile(req.user.id)

    const { eventType } = req.body
    const map = {
      attendance: 10,
      course_completion: 50,
      daily_login: 5
    }

    const pointsToAdd = map[eventType]
    if (!pointsToAdd) {
      return res.status(400).json({ error: "Invalid event type" })
    }

    const current = await pool.query(
      "SELECT points, streak_days, last_login_date FROM gamification_profiles WHERE student_id = $1 LIMIT 1",
      [req.user.id]
    )

    const row = current.rows[0]
    let streak = Number(row.streak_days || 0)
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    if (eventType === "daily_login") {
      const last = row.last_login_date ? new Date(row.last_login_date).toISOString().slice(0, 10) : null
      if (!last) {
        streak = 1
      } else if (last === todayStr) {
        streak = Number(row.streak_days || 1)
      } else {
        const lastDate = new Date(last)
        const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24))
        streak = diffDays === 1 ? streak + 1 : 1
      }
    }

    const newPoints = Number(row.points || 0) + pointsToAdd
    const badges = getBadges(newPoints)

    const result = await pool.query(
      `UPDATE gamification_profiles
       SET points = $1, streak_days = $2, badges = $3, last_login_date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $5
       RETURNING student_id, points, streak_days, badges`,
      [newPoints, streak, badges, todayStr, req.user.id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to award points" })
  }
})

module.exports = router
