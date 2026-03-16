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

module.exports = router