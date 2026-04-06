const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'LMS/assignments',
    resource_type: 'auto', // auto-detect file type
    allowedFormats: [
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
    ],
  },
});

module.exports={cloudinary,storage};