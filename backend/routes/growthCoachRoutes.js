const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    const studentId = req.user.id

    const attendanceRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'Present')::int AS present
       FROM attendance
       WHERE student_id = $1`,
      [studentId]
    )

    const pendingRes = await pool.query(
      `SELECT COUNT(*)::int AS pending
       FROM assignments a
       JOIN enrollments e ON e.program_id = a.program_id
       LEFT JOIN submissions s
         ON s.assignment_id = a.assignment_id
         AND s.student_id = $1
       WHERE e.student_id = $1
         AND COALESCE(s.status, 'Pending') = 'Pending'`,
      [studentId]
    )

    const avgScoreRes = await pool.query(
      `SELECT ROUND(COALESCE(AVG(score), 0), 2) AS avg_score
       FROM submissions
       WHERE student_id = $1
         AND score IS NOT NULL`,
      [studentId]
    )

    const attendanceTotal = Number(attendanceRes.rows[0]?.total || 0)
    const attendancePresent = Number(attendanceRes.rows[0]?.present || 0)
    const attendancePercentage = attendanceTotal ? Number(((attendancePresent / attendanceTotal) * 100).toFixed(2)) : 0
    const pendingAssignments = Number(pendingRes.rows[0]?.pending || 0)
    const averageScore = Number(avgScoreRes.rows[0]?.avg_score || 0)

    const riskAlerts = []
    if (attendancePercentage < 60) riskAlerts.push("Attendance is below 60% (Risk)")
    if (pendingAssignments >= 3) riskAlerts.push("Multiple pending assignments need immediate attention")
    if (averageScore > 0 && averageScore < 50) riskAlerts.push("Average score is below 50")

    const recommendedActions = [
      "Attend all upcoming live sessions and checkpoints",
      "Complete the nearest deadline assignments first",
      "Use AI assistant for concept summary and quiz practice"
    ]

    const insights = [
      `Current attendance is ${attendancePercentage}%`,
      `You have ${pendingAssignments} pending assignments`,
      `Average submission score is ${averageScore}`
    ]

    res.json({
      attendancePercentage,
      pendingAssignments,
      averageScore,
      riskAlerts,
      recommendedActions,
      insights
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch growth coach insights" })
  }
})

module.exports = router
