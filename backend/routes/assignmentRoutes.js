const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const upload = require("../middleware/upload")
const ExcelJS = require("exceljs")

const tableExists = async (tableName) => {
    const result = await pool.query("SELECT to_regclass($1) AS regclass", [`public.${tableName}`])
    return Boolean(result.rows[0]?.regclass)
}

const ensureAssignmentReadTables = async () => {
    const [hasPrograms, hasStudents, hasEnrollments, hasAssignments, hasSubmissions] = await Promise.all([
        tableExists("programs"),
        tableExists("students"),
        tableExists("enrollments"),
        tableExists("assignments"),
        tableExists("submissions")
    ])

    return {
        hasPrograms,
        hasStudents,
        hasEnrollments,
        hasAssignments,
        hasSubmissions,
        ready: hasPrograms && hasStudents && hasEnrollments && hasAssignments && hasSubmissions
    }
}
// ======================================================
// 📌 1. GET ALL ASSIGNMENTS (STUDENT)
// ======================================================
router.get("/", verifyToken, verifyStudent, async (req, res) => {

    const student_id = req.user.id

    try {

        const readiness = await ensureAssignmentReadTables()
        if (!readiness.ready) {
            return res.json([])
        }

        const result = await pool.query(`
            SELECT 
                a.assignment_id,
                a.title,
                a.description,
                a.deadline,
                p.program_name,
                COALESCE(s.status, 'Pending') AS status,
                s.score,
                s.file_url,
                s.submitted_at

            FROM assignments a

            LEFT JOIN submissions s
            ON a.assignment_id = s.assignment_id
            AND s.student_id = $1

            LEFT JOIN programs p
            ON a.program_id = p.program_id

            WHERE a.program_id IN (
                SELECT program_id 
                FROM enrollments 
                WHERE student_id = $1
            )

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

        const readiness = await ensureAssignmentReadTables()
        if (!readiness.hasPrograms || !readiness.hasAssignments) {
            return res.json([])
        }

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

// All submissions (admin)
router.get("/submissions/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const readiness = await ensureAssignmentReadTables()
        if (!readiness.ready) {
            return res.json([])
        }

        const result = await pool.query(`
            SELECT
                s.submission_id,
                s.status,
                s.score,
                s.file_url,
                s.submitted_at,
                st.student_id,
                st.name AS student_name,
                st.student_group,
                a.assignment_id,
                a.title AS assignment_title,
                p.program_id,
                p.program_name
            FROM submissions s
            JOIN students st ON st.student_id = s.student_id
            JOIN assignments a ON a.assignment_id = s.assignment_id
            JOIN programs p ON p.program_id = a.program_id
            ORDER BY s.submitted_at DESC NULLS LAST, s.submission_id DESC
        `)

        res.json(result.rows)
    } catch (err) {
        console.log("🔥 All Submissions Error:", err)
        res.status(500).json({ error: "Failed to fetch submissions" })
    }
})

router.put("/grade-all", verifyToken, verifyAdmin, async (req, res) => {

    const { updates } = req.body

    try {

        await Promise.all(
            updates.map(u =>
                pool.query(
                    `UPDATE submissions SET score = $1 WHERE submission_id = $2`,
                    [u.score, u.submission_id]
                )
            )
        )

        res.json({ message: "All grades updated" })

    } catch (err) {
        console.log("🔥 Bulk Update Error:", err)
        res.status(500).json({ error: "Bulk update failed" })
    }
})

//submissions
router.get("/:id/submissions", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params

    try {

        const readiness = await ensureAssignmentReadTables()
        if (!readiness.hasStudents || !readiness.hasSubmissions) {
            return res.json([])
        }

        const result = await pool.query(`
            SELECT 
                s.submission_id,
                s.student_id,
                st.name,
                s.status,
                s.score,
                s.file_url,
                s.submitted_at

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

// Upload Pending
router.get("/:id/pending-upload", verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params
    try {
        const readiness = await ensureAssignmentReadTables()
        if (!readiness.ready) {
            return res.json({ count: 0, students: [] })
        }

        const result = await pool.query(`
            SELECT s.student_id, s.name
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE e.program_id = (
                SELECT program_id FROM assignments WHERE assignment_id = $1
            )
            AND s.student_id NOT IN (
                SELECT student_id FROM submissions 
                WHERE assignment_id = $1 AND status = 'Submitted'
            )
        `, [id])

        res.json({
            count: result.rows.length,
            students: result.rows
        })

    } catch (err) {
        console.log("🔥 Grade Pending Error:", err)
        res.status(500).json({ error: "Server error" })
    }
})


// Grade Pending
router.get("/:id/pending-grade", verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params
    try {
        const readiness = await ensureAssignmentReadTables()
        if (!readiness.hasStudents || !readiness.hasSubmissions) {
            return res.json({ count: 0, students: [] })
        }

        const result = await pool.query(`
            SELECT s.student_id, s.name
            FROM submissions sub
            JOIN students s ON sub.student_id = s.student_id
            WHERE sub.assignment_id = $1
            AND sub.status = 'Submitted'
            AND sub.score IS NULL
            `, [id])

        res.json({
            count: result.rows.length,
            students: result.rows
        })
    } catch (err) {
        console.log("🔥 Upload Pending Error:", err)
        res.status(500).json({ error: "Server error" })
    }
})

// 📌 DOWNLOAD REPORT
router.get("/:id/report", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params

    try {

        const readiness = await ensureAssignmentReadTables()
        if (!readiness.hasStudents || !readiness.hasSubmissions) {
            return res.status(404).json({ error: "No submission data available for report" })
        }

        const result = await pool.query(`
            SELECT 
                st.name,
                s.score,
                s.file_url
            FROM submissions s
            JOIN students st ON s.student_id = st.student_id
            WHERE s.assignment_id = $1
        `, [id])

        // ✅ Create workbook
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet("Report")

        // ✅ Columns
        worksheet.columns = [
            { header: "Name", key: "name", width: 25 },
            { header: "Score", key: "score", width: 10 },
            { header: "File URL", key: "file_url", width: 40 }
        ]

        // ✅ Add rows
        result.rows.forEach(row => {
            worksheet.addRow({
                name: row.name,
                score: row.score ?? "Not graded",
                file_url: row.file_url || "No file"
            })
        })

        // ✅ Response headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=assignment_${id}_report.xlsx`
        )

        // ✅ Send file
        await workbook.xlsx.write(res)
        res.end()

    } catch (err) {
        console.log("🔥 Report Error:", err)
        res.status(500).json({ error: "Failed to generate report" })
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

router.post("/submit", verifyToken, verifyStudent, upload.single("file"), async (req, res) => {

    const student_id = req.user.id
    const { assignment_id } = req.body
    const file = req.file

    try {
        if (!file) {
            return res.status(400).json({ error: "File is required" })
        }

        // Cloudinary returns the full URL in secure_url or path
        const file_url = file ? (file.path || file.secure_url || file.url || null) : null

        await pool.query(`
                INSERT INTO submissions(student_id, assignment_id, status, file_url, submitted_at)
                VALUES($1, $2, 'Submitted', $3, NOW())
    
                ON CONFLICT (student_id, assignment_id)
                DO UPDATE 
                SET status='Submitted',
                    file_url=$3,
                    submitted_at=NOW()
            `, [student_id, assignment_id, file_url])

        res.json({ message: "Assignment submitted with file", file_url })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Submission failed" })
    }

})

module.exports = router