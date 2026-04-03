const XLSX = require("xlsx")
const { pool } = require("../db/db")

exports.uploadExcel = async (req, res) => {

    try {

        const workbook = XLSX.readFile(req.file.path)

        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const data = XLSX.utils.sheet_to_json(sheet)

        let credentials = []

        for (const row of data) {

            if (!row.name || !row.email_id) continue


            const plainPassword = "123456"

            await pool.query(
                `INSERT INTO students(name,email,password,batch)
VALUES($1,$2,$3,$4)
ON CONFLICT (email) DO NOTHING`,
                [row.name, row.email_id, plainPassword, row.batch]
            )

            // save credentials for admin
            credentials.push({
                name: row.name,
                email: row.email,
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