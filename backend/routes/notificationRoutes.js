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
      show_on_homepage BOOLEAN NOT NULL DEFAULT false,
      banner_image_url TEXT,
      button_text VARCHAR(80),
      button_link TEXT,
      banner_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INT
    )
  `)

  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false")
  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS banner_image_url TEXT")
  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS button_text VARCHAR(80)")
  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS button_link TEXT")
  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS banner_order INT NOT NULL DEFAULT 0")
}

const toBool = (value) => {
  if (typeof value === "boolean") return value
  return String(value).toLowerCase() === "true"
}

router.get("/hero-public", async (req, res) => {
  try {
    await ensureNotificationsTable()

    const result = await pool.query(
      `SELECT
          notification_id AS slide_id,
          title,
          message AS subtitle,
          button_text,
          button_link,
          banner_image_url AS image_url,
          priority,
          banner_order,
          created_at
       FROM notifications
       WHERE show_on_homepage = true
       ORDER BY banner_order ASC, created_at DESC`
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch homepage notifications" })
  }
})

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureNotificationsTable()
    const result = await pool.query(
      "SELECT notification_id, title, message, priority, show_on_homepage, banner_image_url, button_text, button_link, banner_order, created_at FROM notifications ORDER BY created_at DESC LIMIT 100"
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
      "SELECT notification_id, title, message, priority, show_on_homepage, banner_image_url, button_text, button_link, banner_order, created_at FROM notifications ORDER BY created_at DESC LIMIT 200"
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
    const {
      title,
      message,
      priority,
      show_on_homepage,
      banner_image_url,
      button_text,
      button_link,
      banner_order
    } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" })
    }

    const safePriority = ["normal", "important"].includes(String(priority || "").toLowerCase())
      ? String(priority).toLowerCase()
      : "normal"

    const result = await pool.query(
      `INSERT INTO notifications(
        title, message, priority, show_on_homepage, banner_image_url, button_text, button_link, banner_order, created_by
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING notification_id, title, message, priority, show_on_homepage, banner_image_url, button_text, button_link, banner_order, created_at`,
      [
        title,
        message,
        safePriority,
        toBool(show_on_homepage),
        banner_image_url || null,
        button_text || null,
        button_link || null,
        Number.isFinite(Number(banner_order)) ? Number(banner_order) : 0,
        req.user.id
      ]
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
    const {
      title,
      message,
      priority,
      show_on_homepage,
      banner_image_url,
      button_text,
      button_link,
      banner_order
    } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" })
    }

    const safePriority = ["normal", "important"].includes(String(priority || "").toLowerCase())
      ? String(priority).toLowerCase()
      : "normal"

    const result = await pool.query(
      `UPDATE notifications
       SET title=$1,
           message=$2,
           priority=$3,
           show_on_homepage=$4,
           banner_image_url=$5,
           button_text=$6,
           button_link=$7,
           banner_order=$8
       WHERE notification_id=$9
       RETURNING notification_id, title, message, priority, show_on_homepage, banner_image_url, button_text, button_link, banner_order, created_at`,
      [
        title,
        message,
        safePriority,
        toBool(show_on_homepage),
        banner_image_url || null,
        button_text || null,
        button_link || null,
        Number.isFinite(Number(banner_order)) ? Number(banner_order) : 0,
        id
      ]
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
