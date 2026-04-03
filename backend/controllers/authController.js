const jwt = require("jsonwebtoken")
const { pool } = require("../db/db.js")

exports.loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        // Check Admin table
        const admin = await pool.query(
            "SELECT * FROM admins WHERE email=$1 AND password=$2",
            [email, password]
        )

        if (admin.rows.length > 0) {

            const token = jwt.sign(
                { id: admin.rows[0].admin_id, role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            )

            return res.json({
                token,
                role: "admin"
            })

        }

        // Check Students table
        const student = await pool.query(
            "SELECT * FROM students WHERE email=$1 AND password=$2",
            [email, password]
        )

        if (student.rows.length > 0) {

            const token = jwt.sign(
                { id: student.rows[0].student_id, role: "student" },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            )

            return res.json({
                token,
                role: "student"
            })

        }

        // If neither found
        return res.status(401).json({
            message: "Invalid email or password"
        })

    }
    catch (err) {

        console.error(err)

        res.status(500).json({
            message: "Server error"
        })

    }

}