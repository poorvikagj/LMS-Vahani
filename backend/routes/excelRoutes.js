const express = require("express")
const router = express.Router()
const multer = require("multer")

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const { uploadExcel } = require("../controllers/excelController")

const storage = multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,"uploads/")
},

filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}
})

const upload = multer({ storage })

router.post(
    "/upload-excel",
    verifyToken,
    verifyAdmin,
    upload.single("file"),
    uploadExcel
)

module.exports = router