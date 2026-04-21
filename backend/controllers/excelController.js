const XLSX = require("xlsx")
const bcrypt = require("bcryptjs")
const { pool } = require("../db/db")

exports.uploadExcel = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" })
        }

        const uploadedFilePath = req.file.path || req.file.url
        if (!uploadedFilePath) {
            return res.status(400).json({ error: "Uploaded file path not found" })
        }

        let workbook

        if (/^https?:\/\//i.test(uploadedFilePath)) {
            const response = await fetch(uploadedFilePath)
            if (!response.ok) {
                throw new Error(`Failed to fetch uploaded file: ${response.status}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" })
        } else {
            workbook = XLSX.readFile(uploadedFilePath)
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const data = XLSX.utils.sheet_to_json(sheet)

        let credentials = []

        for (const row of data) {

            if (!row.name || !row.email_id) continue


            const plainPassword = "123456"
            const hashedPassword = await bcrypt.hash(plainPassword, 10)

            await pool.query(
                `INSERT INTO students(name,email,password,batch,student_group)
VALUES($1,$2,$3,$4,$5)
ON CONFLICT (email) DO NOTHING`,
                [row.name, row.email_id, hashedPassword, row.batch, "A"]
            )

            // save credentials for admin
            credentials.push({
                name: row.name,
                email: row.email_id,
                password: plainPassword
            })

        }

        res.json({
            message: "Students uploaded successfully",
            total: data.length,
            credentials
        })

    } catch (err) {

        console.log(err)
        res.status(500).json({ error: "Upload failed" })

    }

}