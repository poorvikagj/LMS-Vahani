const express = require("express")
const router = express.Router()

const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

// Get all programs
router.get("/", async (req,res)=>{
try{

const result = await pool.query("SELECT * FROM programs")

res.json(result.rows)

}catch(err){
console.log(err)
res.status(500).json({error:"Server error"})
}
})

// Create program
router.post("/", verifyToken, verifyAdmin, async(req,res)=>{

try{

const { program_name, program_incharge, total_class } = req.body

const result = await pool.query(
"INSERT INTO programs(program_name,program_incharge,total_class) VALUES($1,$2,$3) RETURNING *",
[program_name,program_incharge,total_class]
)

res.json(result.rows[0])

}catch(err){
console.log(err)
res.status(500).json({error:err.message})
}

})

// Enroll program
router.post("/enroll", verifyToken, async(req,res)=>{

try{

const { program_id } = req.body
const student_id = req.user.id

const result = await pool.query(
"INSERT INTO enrollments(student_id,program_id) VALUES($1,$2) RETURNING *",
[student_id,program_id]
)

res.json(result.rows[0])

}catch(err){

if(err.code === "23505"){
res.status(400).json({error:"Already enrolled"})
}else{
console.log(err)
res.status(500).json({error:err.message})
}

}

})

// My programs
router.get("/my-programs", verifyToken, async(req,res)=>{

try{

const student_id = req.user.id

const result = await pool.query(
"SELECT p.* FROM programs p JOIN enrollments e ON p.program_id = e.program_id WHERE e.student_id=$1",
[student_id]
)

res.json(result.rows)

}catch(err){
console.log(err)
res.status(500).json({error:"Server error"})
}

})

router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {

    const { id } = req.params
    const { program_name, program_incharge, total_class } = req.body
    console.log("UPDATE API HIT")
    try {

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
        // 🔹 Fetch students
        const studentsResult = await pool.query(`
            SELECT s.student_id, s.name, s.email
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
            "SELECT program_id, program_name, program_incharge FROM programs WHERE program_id = $1",
            [id]
        )

        res.json({
            program:programResult.rows[0],
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
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }
})

module.exports = router