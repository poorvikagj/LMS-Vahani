const express = require("express")
const router = express.Router()

const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")


// GET ALL STUDENTS (ADMIN ONLY)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT student_id,name,email,batch FROM students ORDER BY batch,name"
        )

        res.json(result.rows)

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Server error" })

    }

})


// ADD STUDENT
router.post("/add", verifyToken, verifyAdmin, async (req, res) => {

    try {

        const { name, email, password, batch } = req.body

        // validation
        if (!name || !email || !password || !batch) {
            return res.status(400).json({ error: "All fields required" })
        }

        const result = await pool.query(
            `INSERT INTO students(name,email,password,batch)
VALUES($1,$2,$3,$4)
RETURNING student_id,name,email,batch`,
            [name, email, password, parseInt(batch)]
        )

        res.json(result.rows[0])

    } catch (err) {

        // duplicate email protection
        if (err.code === "23505") {
            return res.status(400).json({ error: "Email already exists" })
        }

        console.log(err)
        res.status(500).json({ error: "Insert failed" })

    }

})


// UPDATE STUDENT
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {

    try {

        const { id } = req.params
        const { name, email, batch } = req.body

        if (!name || !email || !batch) {
            return res.status(400).json({ error: "All fields required" })
        }

        const result = await pool.query(
            `UPDATE students
SET name=$1,email=$2,batch=$3
WHERE student_id=$4
RETURNING student_id,name,email,batch`,
            [name, email, parseInt(batch), id]
        )

        res.json(result.rows[0])

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Update failed" })

    }

})


// DELETE STUDENT
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {

    try {

        const { id } = req.params

        await pool.query(
            "DELETE FROM students WHERE student_id=$1",
            [id]
        )

        res.json({ message: "Student deleted" })

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Delete failed" })

    }

})

// GET STUDENT REPORT
router.get("/:id/report", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get student basic info
        const studentResult = await pool.query(
            `SELECT student_id, name, email, batch
             FROM students
             WHERE student_id = $1`,
            [id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = studentResult.rows[0];


        // 2. Get program-wise report
        const reportResult = await pool.query(
            `
SELECT 
    p.program_id,
    p.program_name,

    -- attendance
    COUNT(CASE WHEN att.status = 'Present' THEN 1 END) AS classes_attended,
    p.total_class AS total_classes,

    ROUND(
        (COUNT(CASE WHEN att.status = 'Present' THEN 1 END) * 100.0) 
        / NULLIF(p.total_class, 0),
    2) AS attendance_percentage,

    -- assignments
    COUNT(DISTINCT ass.assignment_id) AS total_assignments,

    COUNT(DISTINCT sub.submission_id) 
        FILTER (WHERE sub.status = 'Submitted') 
        AS assignments_submitted,

    ROUND(
        (COUNT(DISTINCT sub.submission_id) 
            FILTER (WHERE sub.status = 'Submitted') * 100.0)
        / NULLIF(COUNT(DISTINCT ass.assignment_id), 0),
    2) AS assignment_submission_percentage

FROM enrollments e

JOIN programs p 
    ON e.program_id = p.program_id

LEFT JOIN attendance att 
    ON att.student_id = e.student_id 
    AND att.program_id = e.program_id

LEFT JOIN assignments ass 
    ON ass.program_id = p.program_id

LEFT JOIN submissions sub 
    ON sub.assignment_id = ass.assignment_id
    AND sub.student_id = e.student_id

WHERE e.student_id = $1

GROUP BY p.program_id, p.program_name, p.total_class
`,
            [id]
        )

        res.json({
            ...student,
            programs: reportResult.rows
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch report" });
    }
});


module.exports = router