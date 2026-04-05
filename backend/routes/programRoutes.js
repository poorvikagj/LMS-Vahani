const express = require("express")
const router = express.Router()

const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const ensureProgramTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS programs (
            program_id SERIAL PRIMARY KEY,
            program_name VARCHAR(150) NOT NULL,
            program_incharge VARCHAR(150),
            total_class INT NOT NULL
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS assignments (
            assignment_id SERIAL PRIMARY KEY,
            program_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            deadline DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
            enrollment_id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            program_id INT NOT NULL,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
            FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
            UNIQUE(student_id, program_id)
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            student_id INT NOT NULL,
            program_id INT NOT NULL,
            class_no INT NOT NULL,
            status VARCHAR(20) CHECK (status IN ('Present','Absent')),
            marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (student_id, program_id, class_no),
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
            FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE
        )
    `)
}

// Get all programs
router.get("/", async (req, res) => {
    try {

        await ensureProgramTables()

        const result = await pool.query("SELECT * FROM programs")

        res.json(result.rows)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

// Create program
router.post("/", verifyToken, verifyAdmin, async (req, res) => {

    try {

        await ensureProgramTables()

        const { program_name, program_incharge, total_class } = req.body

        const result = await pool.query(
            "INSERT INTO programs(program_name,program_incharge,total_class) VALUES($1,$2,$3) RETURNING *",
            [program_name, program_incharge, total_class]
        )

        res.json(result.rows[0])

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
    }

})

// Enroll program
router.post("/enroll", verifyToken, async (req, res) => {
    //there is bug here - wt if an admin tried enrolling inti the program - the UI doesnt allow but wt if u use the postman or hopsctoch
    try {

        await ensureProgramTables()

        const { program_id } = req.body
        const student_id = req.user.id

        const programResult = await pool.query(
            "SELECT total_class FROM programs WHERE program_id = $1",
            [program_id]
        )

        if (programResult.rows.length === 0) {
            return res.status(404).json({ error: "Program not found" })
        }

        const totalClass = Number(programResult.rows[0].total_class || 0)

        let enrollment
        try {
            const insertResult = await pool.query(
                "INSERT INTO enrollments(student_id,program_id) VALUES($1,$2) RETURNING *",
                [student_id, program_id]
            )
            enrollment = insertResult.rows[0]
        } catch (err) {
            if (err.code !== "23505") {
                throw err
            }

            const existing = await pool.query(
                "SELECT * FROM enrollments WHERE student_id = $1 AND program_id = $2",
                [student_id, program_id]
            )
            enrollment = existing.rows[0]
        }

        if (totalClass > 0) {
            await pool.query(
                `INSERT INTO attendance (student_id, program_id, class_no, status)
                 SELECT $1, $2, cls, 'Absent'
                 FROM generate_series(1, $3) AS cls
                 ON CONFLICT (student_id, program_id, class_no)
                 DO NOTHING`,
                [student_id, program_id, totalClass]
            )
        }

        res.json(enrollment)

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: err.message })

    }

})

// My programs
router.get("/my-programs", verifyToken, async (req, res) => {

    try {

        await ensureProgramTables()

        const student_id = req.user.id

        const result = await pool.query(
            "SELECT p.* FROM programs p JOIN enrollments e ON p.program_id = e.program_id WHERE e.student_id=$1",
            [student_id]
        )

        res.json(result.rows)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }

})

router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params
    const { program_name, program_incharge, total_class } = req.body
    console.log("UPDATE API HIT")
    try {

        await ensureProgramTables()

        const result = await pool.query(
            `UPDATE programs 
             SET program_name = $1,
                 program_incharge = $2,
                 total_class = $3
             WHERE program_id = $4
             RETURNING *`,
            [program_name, program_incharge, total_class, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Program not found" })
        }

        res.json(result.rows[0])

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }
})

// ✅ GET PROGRAM DETAILS
router.get("/:id/details", async (req, res) => {

    const { id } = req.params
    try {
        await ensureProgramTables()
        // 🔹 Fetch students
        const studentsResult = await pool.query(`
            SELECT s.student_id, s.name, s.email, s.batch
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE e.program_id = $1
        `, [id])

        // 🔹 Fetch assignments
        const assignmentsResult = await pool.query(`
            SELECT assignment_id, title, description, deadline
            FROM assignments
            WHERE program_id = $1
        `, [id])

        //Program Name
        const programResult = await pool.query(
            "SELECT program_id, program_name, program_incharge, total_class FROM programs WHERE program_id = $1",
            [id]
        )

        res.json({
            program: programResult.rows[0],
            students: studentsResult.rows,
            assignments: assignmentsResult.rows
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }
})


router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params

    try {
        await ensureProgramTables()
        // Optional: delete related data first (important if foreign keys exist)

        await pool.query(
            "DELETE FROM enrollments WHERE program_id = $1",
            [id]
        )

        await pool.query(
            "DELETE FROM assignments WHERE program_id = $1",
            [id]
        )

        // 🔹 Delete program
        const result = await pool.query(
            "DELETE FROM programs WHERE program_id = $1 RETURNING *",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Program not found" })
        }

        res.json({ message: "Program deleted successfully" })

    } catch (err) {
        res.status(500).json({ error: "Server error" })
    }
})

// GET /programs/:id/attendance
router.get("/:id/attendance", async (req, res) => {
    const { id } = req.params

    try {
        await ensureProgramTables()
        // ✅ Get program (for total classes)
        const program = await pool.query(
            "SELECT * FROM programs WHERE program_id = $1",
            [id]
        )

        // ✅ Get students WITH batch (IMPORTANT FIX)
        const students = await pool.query(`
            SELECT s.student_id, s.name, s.batch
            FROM students s
            JOIN enrollments e ON s.student_id = e.student_id
            WHERE e.program_id = $1
            ORDER BY s.batch ASC, s.name ASC
        `, [id])

        // ✅ Get attendance
        const attendance = await pool.query(`SELECT student_id, class_no, status 
            FROM attendance 
            WHERE program_id = $1
        `, [id]);

        res.json({
            program: program.rows[0],
            students: students.rows,
            attendance: attendance.rows
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

module.exports = router