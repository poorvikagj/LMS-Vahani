const express = require("express")
const router = express.Router()
const rateLimit = require("express-rate-limit")
const { loginUser, changePassword, registerAdmin } = require("../controllers/authController")
const verifyToken = require("../middleware/authMiddleware")
const verifyAdmin = require("../middleware/adminMiddleware")

const loginLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many login attempts, please try again after a minute" }
})


router.post("/login", loginLimiter, loginUser)
router.post("/change-password", verifyToken, changePassword)
router.post("/register-admin", verifyToken, verifyAdmin, registerAdmin)

module.exports = router