const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

// MARK ATTENDANCE
router.post("/", verifyToken, verifyAdmin, async (req, res) => {

const { student_id, class_id, status } = req.body

try {

const result = await pool.query(
`INSERT INTO attendance(student_id,class_id,status)
VALUES($1,$2,$3)
RETURNING *`,
[student_id, class_id, status]
)

res.json(result.rows[0])

} catch(err) {

console.error(err)
res.status(500).json({ error: "Server error" })

}

})


// GET ATTENDANCE
router.get("/", verifyToken, async (req,res) => {

try {

const result = await pool.query("SELECT * FROM attendance")

res.json(result.rows)

} catch(err) {

console.error(err)
res.status(500).json({ error: "Server error" })

}

})

module.exports = router