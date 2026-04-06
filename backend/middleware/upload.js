const multer = require("multer")
const { storage } = require("../cloudConfig")

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedFormats = [
            // Documents
            "pdf", "doc", "docx", "txt", "odt", "rtf",
            // Spreadsheets
            "xls", "xlsx", "xlsm", "csv", "ods",
            // Presentations
            "ppt", "pptx", "odp",
            // Images
            "jpg", "jpeg", "png",
            // Video
            "mp4", "avi", "mov", "mkv", "webm", "flv",
            // Audio
            "mp3", "wav", "m4a", "aac", "flac",
            // PowerBI
            "pbix", "pbit"
        ]
        const fileExt = file.originalname.split('.').pop().toLowerCase()
        if (allowedFormats.includes(fileExt)) {
            cb(null, true)
        } else {
            cb(new Error(`File type .${fileExt} not allowed.`))
        }
    }
})

module.exports = upload