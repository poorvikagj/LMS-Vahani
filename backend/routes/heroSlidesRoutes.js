const express = require("express")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const { cloudinary } = require("../cloudConfig")
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const router = express.Router()

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "LMS/hero-slides",
    resource_type: "image",
    allowedFormats: ["jpg", "jpeg", "png", "webp"]
  }
})

const upload = multer({ storage: imageStorage })

const ensureHeroSlidesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      slide_id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      subtitle TEXT,
      button_text VARCHAR(80),
      button_link TEXT,
      image_url TEXT NOT NULL,
      image_public_id TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

const normalizeBool = (value) => {
  if (typeof value === "boolean") return value
  return String(value).toLowerCase() === "true"
}

router.get("/public", async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const result = await pool.query(
      `SELECT slide_id, title, subtitle, button_text, button_link, image_url, is_active, display_order
       FROM hero_slides
       WHERE is_active = true
       ORDER BY display_order ASC, slide_id ASC`
    )

    return res.json(result.rows)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to fetch active hero slides" })
  }
})

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const result = await pool.query(
      `SELECT slide_id, title, subtitle, button_text, button_link, image_url, image_public_id, is_active, display_order, created_at, updated_at
       FROM hero_slides
       ORDER BY display_order ASC, slide_id ASC`
    )

    return res.json(result.rows)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to fetch hero slides" })
  }
})

router.post("/admin", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const { title, subtitle, button_text, button_link, is_active } = req.body

    if (!title || !req.file?.path) {
      return res.status(400).json({ error: "Title and image are required" })
    }

    const orderResult = await pool.query("SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM hero_slides")
    const nextOrder = Number(orderResult.rows[0]?.next_order || 0)

    const result = await pool.query(
      `INSERT INTO hero_slides(title, subtitle, button_text, button_link, image_url, image_public_id, is_active, display_order)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        title,
        subtitle || null,
        button_text || null,
        button_link || null,
        req.file.path,
        req.file.filename || null,
        is_active === undefined ? true : normalizeBool(is_active),
        nextOrder
      ]
    )

    return res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to create hero slide" })
  }
})

router.put("/admin/:id", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const { id } = req.params
    const { title, subtitle, button_text, button_link, is_active } = req.body

    const existing = await pool.query(
      "SELECT * FROM hero_slides WHERE slide_id = $1 LIMIT 1",
      [id]
    )

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Slide not found" })
    }

    let imageUrl = existing.rows[0].image_url
    let imagePublicId = existing.rows[0].image_public_id

    if (req.file?.path) {
      imageUrl = req.file.path
      imagePublicId = req.file.filename || null

      if (existing.rows[0].image_public_id) {
        try {
          await cloudinary.uploader.destroy(existing.rows[0].image_public_id)
        } catch (destroyError) {
          console.log("Failed to delete old hero image:", destroyError.message)
        }
      }
    }

    const result = await pool.query(
      `UPDATE hero_slides
       SET title = $1,
           subtitle = $2,
           button_text = $3,
           button_link = $4,
           image_url = $5,
           image_public_id = $6,
           is_active = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE slide_id = $8
       RETURNING *`,
      [
        title || existing.rows[0].title,
        subtitle === undefined ? existing.rows[0].subtitle : subtitle,
        button_text === undefined ? existing.rows[0].button_text : button_text,
        button_link === undefined ? existing.rows[0].button_link : button_link,
        imageUrl,
        imagePublicId,
        is_active === undefined ? existing.rows[0].is_active : normalizeBool(is_active),
        id
      ]
    )

    return res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to update hero slide" })
  }
})

router.patch("/admin/:id/toggle", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const { id } = req.params
    const { is_active } = req.body

    if (is_active === undefined) {
      return res.status(400).json({ error: "is_active is required" })
    }

    const result = await pool.query(
      `UPDATE hero_slides
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE slide_id = $2
       RETURNING *`,
      [normalizeBool(is_active), id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: "Slide not found" })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to toggle hero slide" })
  }
})

router.patch("/admin/reorder", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const { slideIds } = req.body

    if (!Array.isArray(slideIds) || slideIds.length === 0) {
      return res.status(400).json({ error: "slideIds array is required" })
    }

    await pool.query("BEGIN")

    for (let index = 0; index < slideIds.length; index += 1) {
      await pool.query(
        `UPDATE hero_slides
         SET display_order = $1, updated_at = CURRENT_TIMESTAMP
         WHERE slide_id = $2`,
        [index, slideIds[index]]
      )
    }

    await pool.query("COMMIT")

    const result = await pool.query(
      `SELECT slide_id, title, subtitle, button_text, button_link, image_url, is_active, display_order
       FROM hero_slides
       ORDER BY display_order ASC, slide_id ASC`
    )

    return res.json(result.rows)
  } catch (error) {
    await pool.query("ROLLBACK")
    console.log(error)
    return res.status(500).json({ error: "Failed to reorder hero slides" })
  }
})

router.delete("/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureHeroSlidesTable()

    const { id } = req.params

    const existing = await pool.query(
      "SELECT slide_id, image_public_id FROM hero_slides WHERE slide_id = $1 LIMIT 1",
      [id]
    )

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Slide not found" })
    }

    await pool.query("DELETE FROM hero_slides WHERE slide_id = $1", [id])

    if (existing.rows[0].image_public_id) {
      try {
        await cloudinary.uploader.destroy(existing.rows[0].image_public_id)
      } catch (destroyError) {
        console.log("Failed to delete hero image:", destroyError.message)
      }
    }

    return res.json({ message: "Slide deleted" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to delete hero slide" })
  }
})

module.exports = router
