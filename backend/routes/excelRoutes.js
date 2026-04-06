const express = require("express")
const router = express.Router()
const multer = require("multer")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const { uploadExcel } = require("../controllers/excelController")
const { storage } = require("../cloudConfig")

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedFormats = ["xls", "xlsx", "xlsm", "csv", "ods"]
        const fileExt = file.originalname.split('.').pop().toLowerCase()
        if (allowedFormats.includes(fileExt)) {
            cb(null, true)
        } else {
            cb(new Error(`Only Excel files allowed (.xls, .xlsx, .xlsm, .csv, .ods)`))
        }
    }
})

router.post(
    "/upload-excel",
    verifyToken,
    verifyAdmin,
    upload.single("file"),
    uploadExcel
)

module.exports = router