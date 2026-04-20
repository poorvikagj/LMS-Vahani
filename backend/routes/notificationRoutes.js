const express = require("express")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")
const { getIO } = require("../socket")

const ensureNotificationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'normal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INT
    )
  `)
}

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const result = await pool.query(
      "SELECT notification_id, title, message, priority, created_at FROM notifications ORDER BY created_at DESC LIMIT 100"
    )
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const result = await pool.query(
      "SELECT notification_id, title, message, priority, created_at FROM notifications ORDER BY created_at DESC LIMIT 200"
    )
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

router.post("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const { title, message, priority } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" })
    }

    const safePriority = ["normal", "important"].includes(String(priority || "").toLowerCase())
      ? String(priority).toLowerCase()
      : "normal"

    const result = await pool.query(
      `INSERT INTO notifications(title, message, priority, created_by)
       VALUES($1,$2,$3,$4)
       RETURNING notification_id, title, message, priority, created_at`,
      [title, message, safePriority, req.user.id]
    )

    const created = result.rows[0]
    const io = getIO()
    if (io) {
      io.to("students").emit("notification:new", created)
    }

    res.json(created)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to create notification" })
  }
})

router.put("/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const { id } = req.params
    const { title, message, priority } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" })
    }

    const safePriority = ["normal", "important"].includes(String(priority || "").toLowerCase())
      ? String(priority).toLowerCase()
      : "normal"

    const result = await pool.query(
      `UPDATE notifications
       SET title=$1, message=$2, priority=$3
       WHERE notification_id=$4
       RETURNING notification_id, title, message, priority, created_at`,
      [title, message, safePriority, id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: "Notification not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to update notification" })
  }
})

router.delete("/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const { id } = req.params

    await pool.query("DELETE FROM notifications WHERE notification_id=$1", [id])
    res.json({ message: "Notification deleted" })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to delete notification" })
  }
})

module.exports = router
