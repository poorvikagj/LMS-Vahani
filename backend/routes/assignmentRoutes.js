const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

// ======================================================
// 📌 1. GET ALL ASSIGNMENTS (STUDENT)
// ======================================================
router.get("/", verifyToken, verifyStudent, async (req, res) => {

    const student_id = req.user.id

    try {

        const result = await pool.query(`
            SELECT 
                a.assignment_id,
                a.title,
                a.deadline,
                p.program_name,
                COALESCE(s.status, 'Pending') AS status,
                s.score

            FROM assignments a

            LEFT JOIN submissions s
            ON a.assignment_id = s.assignment_id
            AND s.student_id = $1

            LEFT JOIN programs p
            ON a.program_id = p.program_id

            ORDER BY a.deadline ASC
        `, [student_id])

        res.json(result.rows)

    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Server error" })
    }

})


// ======================================================
// 📌 2. SUBMIT ASSIGNMENT (STUDENT)
// ======================================================
router.post("/submit", verifyToken, verifyStudent, async (req, res) => {

    const student_id = req.user.id
    const { assignment_id } = req.body

    try {

        await pool.query(`
            INSERT INTO submissions(student_id, assignment_id, status)
            VALUES($1, $2, 'Submitted')
            ON CONFLICT (student_id, assignment_id)
            DO UPDATE SET status = 'Submitted'
        `, [student_id, assignment_id])

        res.json({ message: "Assignment submitted successfully" })

    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Submission failed" })
    }

})


// ======================================================
// 📌 3. CREATE ASSIGNMENT (ADMIN)
// ======================================================
router.post("/create", verifyToken, verifyAdmin, async (req, res) => {

    const { program_id, title, description, deadline } = req.body

    try {

        const result = await pool.query(`
            INSERT INTO assignments(program_id, title, description, deadline)
            VALUES($1, $2, $3, $4)
            RETURNING *
        `, [program_id, title, description, deadline])

        res.json(result.rows[0])

    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Creation failed" })
    }

})


// ======================================================
// 📌 4. GET ALL ASSIGNMENTS (ADMIN)
// ======================================================
router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT 
                a.assignment_id,
                a.title,
                a.description,
                a.deadline,
                p.program_name
                FROM assignments a
                JOIN programs p ON a.program_id = p.program_id
                ORDER BY a.deadline ASC
        `)

        res.json(result.rows)
        
    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Server error" })
    }
    
})


//submissions
router.get("/:id/submissions", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params

    try {

        const result = await pool.query(`
            SELECT 
                s.submission_id,
                s.student_id,
                st.name,
                s.status,
                s.score

            FROM submissions s
            JOIN students st ON s.student_id = st.student_id

            WHERE s.assignment_id = $1
        `, [id])

        res.json(result.rows)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }

})

// ======================================================
// 📌 5. UPDATE ASSIGNMENT (ADMIN)
// ======================================================
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {

    console.log("✅ UPDATE HIT")

    const { id } = req.params
    const { title, description, deadline } = req.body

    try {

        const result = await pool.query(`
            UPDATE assignments
            SET title=$1, description=$2, deadline=$3
            WHERE assignment_id=$4
            RETURNING *
        `, [title, description, deadline, id])

        res.json(result.rows[0])

    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Update failed" })
    }

})


// ======================================================
// 📌 6. DELETE ASSIGNMENT (ADMIN)
// ======================================================
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params

    try {

        await pool.query(
            "DELETE FROM assignments WHERE assignment_id=$1",
            [id]
        )

        res.json({ message: "Deleted successfully" })

    } catch (err) {
        console.log("🔥 ERROR:", err)
        res.status(500).json({ error: "Delete failed" })
    }

})




//grading
router.put("/grade/:submission_id", verifyToken, verifyAdmin, async (req, res) => {

    const { submission_id } = req.params
    const { score } = req.body

    try {

        const result = await pool.query(`
            UPDATE submissions
            SET score = $1
            WHERE submission_id = $2
            RETURNING *
        `, [score, submission_id])

        res.json(result.rows[0])

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Grading failed" })
    }

})
module.exports = router