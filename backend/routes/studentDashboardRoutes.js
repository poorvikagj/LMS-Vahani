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

    // 3. Assignments (dummy for now or create table later)
    const pendingAssignments = 2;
    const completedAssignments = 5;

    res.json({
      totalPrograms: parseInt(programs.rows[0].count),
      attendancePercentage: Math.round(attendancePercentage || 0),
      pendingAssignments,
      completedAssignments,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
