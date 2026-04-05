const express = require("express");
const router = express.Router();
const { pool } = require("../db/db");

const verifyToken = require("../middleware/authMiddleware");
const verifyStudent = require("../middleware/studentMiddleware");

router.get("/", verifyToken, verifyStudent, async (req, res) => {
  const student_id = req.user.id;

  try {
    // 1. Total enrolled programs
    const programs = await pool.query(
      "SELECT COUNT(*) FROM enrollments WHERE student_id=$1",
      [student_id],
    );

    // 2. Attendance %
    // ✅ SAFE attendance calculation (NO SQL division)
    const totalRes = await pool.query(
      "SELECT COUNT(*) as total FROM attendance WHERE student_id=$1",
      [student_id],
    );

    const total = parseInt(totalRes.rows[0].total);

    let attendancePercentage = 0;

    if (total > 0) {
      const presentRes = await pool.query(
        "SELECT COUNT(*) as present FROM attendance WHERE student_id=$1 AND status='Present'",
        [student_id],
      );

      const present = parseInt(presentRes.rows[0].present);

      attendancePercentage = (present / total) * 100;
    }

    // 3. Assignment status summary
    const assignmentSummaryResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE COALESCE(sub.status, 'Pending') = 'Pending') AS pending_assignments,
        COUNT(*) FILTER (WHERE COALESCE(sub.status, 'Pending') = 'Submitted') AS completed_assignments
      FROM assignments a
      JOIN enrollments e
        ON e.program_id = a.program_id
      LEFT JOIN submissions sub
        ON sub.assignment_id = a.assignment_id
        AND sub.student_id = $1
      WHERE e.student_id = $1`,
      [student_id],
    );

    const pendingAssignments = Number(
      assignmentSummaryResult.rows[0]?.pending_assignments || 0,
    );

    const completedAssignments = Number(
      assignmentSummaryResult.rows[0]?.completed_assignments || 0,
    );

    // 4. Upcoming programs based on next assignment deadline
    const upcomingProgramsResult = await pool.query(
      `SELECT
        p.program_id,
        p.program_name,
        p.program_incharge,
        MIN(a.deadline) FILTER (WHERE a.deadline >= CURRENT_DATE) AS next_deadline
      FROM enrollments e
      JOIN programs p ON p.program_id = e.program_id
      LEFT JOIN assignments a ON a.program_id = p.program_id
      WHERE e.student_id = $1
      GROUP BY p.program_id, p.program_name, p.program_incharge
      ORDER BY next_deadline NULLS LAST, p.program_name
      LIMIT 8`,
      [student_id],
    );

    // 5. Last date (deadline) of each pending submission
    const upcomingDeadlinesResult = await pool.query(
      `SELECT
        a.assignment_id,
        a.title,
        a.deadline,
        p.program_name,
        COALESCE(sub.status, 'Pending') AS status
      FROM assignments a
      JOIN enrollments e ON e.program_id = a.program_id
      JOIN programs p ON p.program_id = a.program_id
      LEFT JOIN submissions sub
        ON sub.assignment_id = a.assignment_id
        AND sub.student_id = $1
      WHERE e.student_id = $1
        AND COALESCE(sub.status, 'Pending') = 'Pending'
      ORDER BY a.deadline ASC
      LIMIT 12`,
      [student_id],
    );

    res.json({
      totalPrograms: parseInt(programs.rows[0].count),
      attendancePercentage: Math.round(attendancePercentage || 0),
      pendingAssignments,
      completedAssignments,
      upcomingPrograms: upcomingProgramsResult.rows,
      upcomingDeadlines: upcomingDeadlinesResult.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
