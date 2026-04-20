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

    const result = await pool.query(
      `INSERT INTO messages(sender_id, sender_role, receiver_id, receiver_role, message)
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [req.user.id, req.user.role, receiver_id, receiver_role, message]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

module.exports = router
