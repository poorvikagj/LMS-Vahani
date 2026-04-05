const express = require("express")
const router = express.Router()

const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")
const { chatStudentAssistant } = require("../controllers/analyticsAIController")

router.post("/chat", verifyToken, verifyStudent, chatStudentAssistant)

module.exports = router
