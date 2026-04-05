const jwt = require("jsonwebtoken")
const { pool } = require("../db/db.js")

const getDefaultAdminConfig = () => {
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@lms.com"
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"
    const username = process.env.DEFAULT_ADMIN_USERNAME || "admin"
    return { email, password, username }
}

const normalizeLoginIdentifier = (rawIdentifier, defaultAdminEmail, defaultAdminUsername) => {
    if (!rawIdentifier) return ""
    const identifier = String(rawIdentifier).trim().toLowerCase()
    if (identifier === String(defaultAdminUsername).toLowerCase()) {
        return String(defaultAdminEmail).toLowerCase()
    }
    return identifier
}

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

    const { email: defaultAdminEmail, password: defaultAdminPassword } = getDefaultAdminConfig()

    const existingDefaultAdmin = await pool.query(
        "SELECT admin_id, password FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [defaultAdminEmail]
    )

    if (existingDefaultAdmin.rows.length === 0) {
        await pool.query(
            "INSERT INTO admins (email, password) VALUES ($1, $2)",
            [defaultAdminEmail, defaultAdminPassword]
        )
    } else if (existingDefaultAdmin.rows[0].password !== defaultAdminPassword) {
        await pool.query(
            "UPDATE admins SET password = $1 WHERE admin_id = $2",
            [defaultAdminPassword, existingDefaultAdmin.rows[0].admin_id]
        )
    }
}

exports.loginUser = async (req, res) => {

    try {

        await ensureAuthBootstrap()

        const { email, username, password } = req.body
        const {
            email: defaultAdminEmail,
            password: defaultAdminPassword,
            username: defaultAdminUsername
        } = getDefaultAdminConfig()

        const loginIdentifier = normalizeLoginIdentifier(
            email || username,
            defaultAdminEmail,
            defaultAdminUsername
        )

        // Guaranteed fallback admin login path if DB is not ready yet.
        if (
            loginIdentifier === String(defaultAdminEmail).toLowerCase()
            && password === defaultAdminPassword
        ) {
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
            "SELECT * FROM admins WHERE LOWER(email)=LOWER($1) AND password=$2",
            [loginIdentifier, password]
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
            "SELECT * FROM students WHERE LOWER(email)=LOWER($1) AND password=$2",
            [loginIdentifier, password]
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