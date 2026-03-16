const express = require("express")
const router = express.Router()

const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")


// GET ALL STUDENTS (ADMIN ONLY)
router.get("/", verifyToken, verifyAdmin, async (req,res)=>{

try{

const result = await pool.query(
"SELECT student_id,name,email,batch FROM students ORDER BY student_id"
)

res.json(result.rows)

}catch(err){

console.log(err)
res.status(500).json({error:"Server error"})

}

})


// ADD STUDENT
router.post("/add", verifyToken, verifyAdmin, async (req,res)=>{

try{

const { name, email, password, batch } = req.body

// validation
if(!name || !email || !password || !batch){
return res.status(400).json({error:"All fields required"})
}

const result = await pool.query(
`INSERT INTO students(name,email,password,batch)
VALUES($1,$2,$3,$4)
RETURNING student_id,name,email,batch`,
[name,email,password,parseInt(batch)]
)

res.json(result.rows[0])

}catch(err){

// duplicate email protection
if(err.code === "23505"){
return res.status(400).json({error:"Email already exists"})
}

console.log(err)
res.status(500).json({error:"Insert failed"})

}

})


// UPDATE STUDENT
router.put("/:id", verifyToken, verifyAdmin, async (req,res)=>{

try{

const { id } = req.params
const { name, email, batch } = req.body

if(!name || !email || !batch){
return res.status(400).json({error:"All fields required"})
}

const result = await pool.query(
`UPDATE students
SET name=$1,email=$2,batch=$3
WHERE student_id=$4
RETURNING student_id,name,email,batch`,
[name,email,parseInt(batch),id]
)

res.json(result.rows[0])

}catch(err){

console.log(err)
res.status(500).json({error:"Update failed"})

}

})


// DELETE STUDENT
router.delete("/:id", verifyToken, verifyAdmin, async (req,res)=>{

try{

const { id } = req.params

await pool.query(
"DELETE FROM students WHERE student_id=$1",
[id]
)

res.json({message:"Student deleted"})

}catch(err){

console.log(err)
res.status(500).json({error:"Delete failed"})

}

})


module.exports = router