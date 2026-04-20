const express = require("express")
const router = express.Router()
const rateLimit = require("express-rate-limit")
const { loginUser, changePassword } = require("../controllers/authController")
const verifyToken = require("../middleware/authMiddleware")

const loginLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many login attempts, please try again after a minute" }
})


router.post("/login", loginLimiter, loginUser)
router.post("/change-password", verifyToken, changePassword)

module.exports = router