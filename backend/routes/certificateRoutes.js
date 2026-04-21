const express = require("express")
const crypto = require("crypto")
const router = express.Router()
const { pool } = require("../db/db")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")

const ensureCertificatesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      certificate_id SERIAL PRIMARY KEY,
      certificate_code VARCHAR(64) UNIQUE NOT NULL,
      student_id INT NOT NULL,
      program_id INT NOT NULL,
      student_name VARCHAR(200) NOT NULL,
      course_name VARCHAR(200) NOT NULL,
      issued_on DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      template_config JSONB,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, program_id)
    )
  `)
}

const resolveCertificateMetadata = async (student_id, program_id) => {
  const result = await pool.query(
    `SELECT s.name AS student_name, p.program_name AS course_name
     FROM students s
     JOIN programs p ON p.program_id = $2
     WHERE s.student_id = $1
     LIMIT 1`,
    [student_id, program_id]
  )

  return result.rows[0] || null
}

const buildCertificateCode = () => `CERT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`

router.get("/verify/:code", async (req, res) => {
  try {
    await ensureCertificatesTable()
    const result = await pool.query(
      `SELECT certificate_code, student_name, course_name, issued_on, status, created_at
       FROM certificates
       WHERE certificate_code = $1
       LIMIT 1`,
      [req.params.code]
    )

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: "Certificate not found" })
    }

    return res.json({ ok: true, data: result.rows[0] })
  } catch (error) {
    console.log(error)
    res.status(500).json({ ok: false, message: "Verification failed" })
  }
})

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const result = await pool.query(
      `SELECT certificate_id, certificate_code, student_name, course_name, issued_on, status, template_config, created_at
       FROM certificates
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch certificates" })
  }
})

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const result = await pool.query(
      `SELECT certificate_id, certificate_code, student_id, program_id, student_name, course_name, issued_on, status, template_config, created_at
       FROM certificates
       ORDER BY created_at DESC`
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch certificates" })
  }
})

router.get("/admin/program/:programId/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { programId } = req.params

    const result = await pool.query(
      `SELECT s.student_id, s.name
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       WHERE e.program_id = $1
       ORDER BY s.name ASC`,
      [programId]
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to fetch enrolled students" })
  }
})

router.post("/admin/generate", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const { student_id, program_id, issued_on, template_config } = req.body

    if (!student_id || !program_id || !issued_on) {
      return res.status(400).json({ error: "Missing certificate fields" })
    }

    const metadata = await resolveCertificateMetadata(student_id, program_id)
    if (!metadata) {
      return res.status(404).json({ error: "Student or program not found" })
    }

    const existing = await pool.query(
      "SELECT certificate_id FROM certificates WHERE student_id=$1 AND program_id=$2 LIMIT 1",
      [student_id, program_id]
    )

    if (existing.rows.length) {
      return res.status(409).json({ error: "Certificate already exists for this student and course" })
    }

    const certificate_code = buildCertificateCode()
    const result = await pool.query(
      `INSERT INTO certificates(
        certificate_code, student_id, program_id, student_name, course_name, issued_on, status, template_config, created_by
      ) VALUES($1,$2,$3,$4,$5,$6,'Active',$7,$8)
      RETURNING *`,
      [
        certificate_code,
        student_id,
        program_id,
        metadata.student_name,
        metadata.course_name,
        issued_on,
        template_config || {},
        req.user.id
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to generate certificate" })
  }
})

router.post("/admin/generate-bulk", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" })
    }

    const created = []
    const skipped = []

    for (const item of items) {
      const { student_id, program_id, issued_on, template_config } = item
      if (!student_id || !program_id || !issued_on) {
        skipped.push({ item, reason: "Missing required fields" })
        continue
      }

      const metadata = await resolveCertificateMetadata(student_id, program_id)
      if (!metadata) {
        skipped.push({ item, reason: "Student or program not found" })
        continue
      }

      const existing = await pool.query(
        "SELECT certificate_id FROM certificates WHERE student_id=$1 AND program_id=$2 LIMIT 1",
        [student_id, program_id]
      )

      if (existing.rows.length) {
        skipped.push({ item, reason: "Duplicate certificate" })
        continue
      }

      const result = await pool.query(
        `INSERT INTO certificates(certificate_code, student_id, program_id, student_name, course_name, issued_on, status, template_config, created_by)
         VALUES($1,$2,$3,$4,$5,$6,'Active',$7,$8)
         RETURNING *`,
        [
          buildCertificateCode(),
          student_id,
          program_id,
          metadata.student_name,
          metadata.course_name,
          issued_on,
          template_config || {},
          req.user.id
        ]
      )

      created.push(result.rows[0])
    }

    res.json({ created, skipped })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Bulk generation failed" })
  }
})

router.put("/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const { id } = req.params
    const { student_name, course_name, issued_on, template_config } = req.body

    const existing = await pool.query(
      `SELECT student_name, course_name, issued_on, template_config
       FROM certificates
       WHERE certificate_id = $1
       LIMIT 1`,
      [id]
    )

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Certificate not found" })
    }

    const current = existing.rows[0]

    const result = await pool.query(
      `UPDATE certificates
       SET student_name=$1, course_name=$2, issued_on=$3, template_config=$4, updated_at=CURRENT_TIMESTAMP
       WHERE certificate_id=$5
       RETURNING *`,
      [
        student_name || current.student_name,
        course_name || current.course_name,
        issued_on || current.issued_on,
        template_config || current.template_config || {},
        id
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to update certificate" })
  }
})

router.post("/admin/:id/revoke", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const { id } = req.params

    const result = await pool.query(
      `UPDATE certificates SET status='Revoked', updated_at=CURRENT_TIMESTAMP WHERE certificate_id=$1 RETURNING *`,
      [id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to revoke certificate" })
  }
})

router.post("/admin/:id/regenerate", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ensureCertificatesTable()
    const { id } = req.params

    const result = await pool.query(
      `UPDATE certificates
       SET certificate_code=$1, status='Active', updated_at=CURRENT_TIMESTAMP
       WHERE certificate_id=$2
       RETURNING *`,
      [buildCertificateCode(), id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to regenerate certificate" })
  }
})

module.exports = router
