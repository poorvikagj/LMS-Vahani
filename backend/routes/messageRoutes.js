const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")

const ensureMessagesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id SERIAL PRIMARY KEY,
      sender_id INT NOT NULL,
      sender_role VARCHAR(20) NOT NULL,
      receiver_id INT NOT NULL,
      receiver_role VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

const getContactsForUser = async (user) => {
  if (user.role === "admin") {
    const students = await pool.query(
      `SELECT student_id AS id, name, email, 'student'::text AS role
       FROM students
       ORDER BY name ASC, student_id ASC`
    )

    return students.rows
  }

  const admins = await pool.query(
    `SELECT admin_id AS id,
            COALESCE(NULLIF(full_name, ''), email) AS name,
            email,
            'admin'::text AS role
     FROM admins
     ORDER BY COALESCE(NULLIF(full_name, ''), email) ASC, admin_id ASC`
  )

  return admins.rows
}

const receiverExists = async (receiverId, receiverRole) => {
  if (receiverRole === "student") {
    const student = await pool.query("SELECT student_id FROM students WHERE student_id = $1 LIMIT 1", [receiverId])
    return student.rows.length > 0
  }

  if (receiverRole === "admin") {
    const admin = await pool.query("SELECT admin_id FROM admins WHERE admin_id = $1 LIMIT 1", [receiverId])
    return admin.rows.length > 0
  }

  return false
}

router.get("/contacts", verifyToken, async (req, res) => {
  try {
    const contacts = await getContactsForUser(req.user)
    res.json(contacts)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch contacts" })
  }
})

router.get("/inbox", verifyToken, async (req, res) => {
  try {
    await ensureMessagesTable()

    const result = await pool.query(
      `SELECT message_id, sender_id, sender_role, receiver_id, receiver_role, message, created_at
       FROM messages
       WHERE receiver_id = $1 AND receiver_role = $2
       ORDER BY created_at DESC`,
      [req.user.id, req.user.role]
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch inbox" })
  }
})

router.post("/send", verifyToken, async (req, res) => {
  try {
    await ensureMessagesTable()
    const { receiver_id, receiver_role, message } = req.body

    if (!receiver_id || !receiver_role || !message) {
      return res.status(400).json({ error: "receiver_id, receiver_role and message are required" })
    }

    const normalizedRole = String(receiver_role).toLowerCase()
    if (!["admin", "student"].includes(normalizedRole)) {
      return res.status(400).json({ error: "receiver_role must be admin or student" })
    }

    if (normalizedRole === req.user.role) {
      return res.status(400).json({ error: "Messaging is only allowed between admin and student" })
    }

    const recipientId = Number(receiver_id)
    if (!Number.isInteger(recipientId) || recipientId <= 0) {
      return res.status(400).json({ error: "receiver_id must be a valid positive number" })
    }

    const exists = await receiverExists(recipientId, normalizedRole)
    if (!exists) {
      return res.status(404).json({ error: "Receiver not found" })
    }

    const result = await pool.query(
      `INSERT INTO messages(sender_id, sender_role, receiver_id, receiver_role, message)
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [req.user.id, req.user.role, recipientId, normalizedRole, String(message).trim()]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

module.exports = router
