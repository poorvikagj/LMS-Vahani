const express = require("express")
const router = express.Router()

const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const ensureStudentsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            student_id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            batch INT
        )
    `)
}


// GET ALL STUDENTS (ADMIN ONLY)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {

    try {

        await ensureStudentsTable()

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

        await ensureStudentsTable()

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
        res.status(500).json({ error: `Insert failed: ${err.message}` })

    }

})


// UPDATE STUDENT
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {

    try {

        await ensureStudentsTable()

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

        await ensureStudentsTable()

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
        await ensureStudentsTable()
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
    COALESCE(att.classes_attended, 0) AS classes_attended,
    p.total_class AS total_classes,

    ROUND(
        (COALESCE(att.classes_attended, 0) * 100.0) 
        / NULLIF(p.total_class, 0),
    2) AS attendance_percentage,

    -- assignments
    COALESCE(ass.total_assignments, 0) AS total_assignments,
    COALESCE(sub.assignments_submitted, 0) AS assignments_submitted,

    ROUND(
        (COALESCE(sub.assignments_submitted, 0) * 100.0)
        / NULLIF(ass.total_assignments, 0),
    2) AS assignment_submission_percentage
    ,
    ROUND(COALESCE(sub.avg_submission_score, 0), 2) AS avg_submission_score

FROM enrollments e

JOIN programs p 
    ON e.program_id = p.program_id

-- ✅ Attendance aggregated separately
LEFT JOIN (
    SELECT 
        student_id,
        program_id,
        COUNT(*) FILTER (WHERE status = 'Present') AS classes_attended
    FROM attendance
    GROUP BY student_id, program_id
) att
ON att.student_id = e.student_id 
AND att.program_id = e.program_id

-- ✅ Assignments count
LEFT JOIN (
    SELECT 
        program_id,
        COUNT(*) AS total_assignments
    FROM assignments
    GROUP BY program_id
) ass
ON ass.program_id = p.program_id

-- ✅ Submissions count
LEFT JOIN (
    SELECT 
        s.student_id,
        a.program_id,
        COUNT(*) FILTER (WHERE s.status = 'Submitted') AS assignments_submitted,
        AVG(s.score) FILTER (
            WHERE s.status = 'Submitted'
            AND s.score IS NOT NULL
        ) AS avg_submission_score
    FROM submissions s
    JOIN assignments a 
        ON s.assignment_id = a.assignment_id
    GROUP BY s.student_id, a.program_id
) sub
ON sub.student_id = e.student_id 
AND sub.program_id = p.program_id

WHERE e.student_id = $1
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