const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { pool } = require("../db/db.js")

const getDefaultAdminConfig = () => {
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@lms.com"
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"
    const username = process.env.DEFAULT_ADMIN_USERNAME || "admin"
    return { email, password, username }
}

const BCRYPT_ROUNDS = 10

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""))

const verifyPassword = async (plainPassword, storedPassword) => {
    if (!storedPassword) return false
    if (isBcryptHash(storedPassword)) {
        return bcrypt.compare(plainPassword, storedPassword)
    }
    return plainPassword === storedPassword
}

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, BCRYPT_ROUNDS)

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
        const hashedPassword = await hashPassword(defaultAdminPassword)
        await pool.query(
            "INSERT INTO admins (email, password) VALUES ($1, $2)",
            [defaultAdminEmail, hashedPassword]
        )
    } else {
        const existingPassword = existingDefaultAdmin.rows[0].password
        const shouldMigratePlainDefault = !isBcryptHash(existingPassword) && existingPassword === defaultAdminPassword

        if (shouldMigratePlainDefault) {
            const hashedPassword = await hashPassword(defaultAdminPassword)
            await pool.query(
                "UPDATE admins SET password = $1 WHERE admin_id = $2",
                [hashedPassword, existingDefaultAdmin.rows[0].admin_id]
            )
        }
    }
}

exports.loginUser = async (req, res) => {

    try {

        await ensureAuthBootstrap()

        const { email, username, password } = req.body
        const rawIdentifier = email || username

        if (!rawIdentifier || !password) {
            return res.status(400).json({ message: "Email/username and password are required" })
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const emailCandidate = String(rawIdentifier).trim()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate)) {
            return res.status(400).json({ message: "Invalid email format" })
        }

        const {
            email: defaultAdminEmail,
            username: defaultAdminUsername
        } = getDefaultAdminConfig()

        const loginIdentifier = normalizeLoginIdentifier(
            rawIdentifier,
            defaultAdminEmail,
            defaultAdminUsername
        )

        // Check Admin table
        const admin = await pool.query(
            "SELECT admin_id, email, password FROM admins WHERE LOWER(email)=LOWER($1) LIMIT 1",
            [loginIdentifier]
        )

        if (admin.rows.length > 0) {
            const isPasswordValid = await verifyPassword(password, admin.rows[0].password)
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid email or password" })
            }

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
            "SELECT student_id, email, password FROM students WHERE LOWER(email)=LOWER($1) LIMIT 1",
            [loginIdentifier]
        )

        if (student.rows.length > 0) {
            const isPasswordValid = await verifyPassword(password, student.rows[0].password)
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid email or password" })
            }

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

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" })
        }

        const isAdmin = req.user.role === "admin"
        const tableName = isAdmin ? "admins" : "students"
        const idColumn = isAdmin ? "admin_id" : "student_id"

        const userResult = await pool.query(
            `SELECT ${idColumn}, password FROM ${tableName} WHERE ${idColumn} = $1 LIMIT 1`,
            [req.user.id]
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" })
        }

        const existingPassword = userResult.rows[0].password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, existingPassword)

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" })
        }

        const hashedPassword = await hashPassword(newPassword)

        await pool.query(
            `UPDATE ${tableName} SET password = $1 WHERE ${idColumn} = $2`,
            [hashedPassword, req.user.id]
        )

        return res.json({ message: "Password changed successfully" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Server error" })
    }
}