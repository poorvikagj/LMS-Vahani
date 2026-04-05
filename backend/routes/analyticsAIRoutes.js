const express = require("express")
const router = express.Router()

const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")
const { getAnalyticsAISummary, queryAnalyticsWithAI, chatAnalyticsAssistant } = require("../controllers/analyticsAIController")

router.get("/summary", verifyToken, verifyAdmin, getAnalyticsAISummary)
router.post("/query", verifyToken, verifyAdmin, queryAnalyticsWithAI)
router.post("/chat", verifyToken, verifyAdmin, chatAnalyticsAssistant)

module.exports = router
