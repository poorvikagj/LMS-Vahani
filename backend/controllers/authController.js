const jwt = require("jsonwebtoken")
const { pool } = require("../db/db.js")

const ensureAuthBootstrap = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
            admin_id SERIAL PRIMARY KEY,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            student_id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            batch INT
        )
    `)

    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@lms.com"
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"

    const adminCount = await pool.query("SELECT COUNT(*)::int AS count FROM admins")
    if (adminCount.rows[0].count === 0) {
        await pool.query(
            "INSERT INTO admins (email, password) VALUES ($1, $2)",
            [defaultAdminEmail, defaultAdminPassword]
        )
        console.log(`Default admin created: ${defaultAdminEmail}`)
    }
}

exports.loginUser = async (req, res) => {

    try {

        await ensureAuthBootstrap()

        const { email, password } = req.body
        const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@lms.com"
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"

        // Guaranteed fallback admin login path if DB is not ready yet.
        if (email === defaultAdminEmail && password === defaultAdminPassword) {
            const token = jwt.sign(
                { id: 0, role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            )

            return res.json({
                token,
                role: "admin"
            })
        }

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