const express = require("express")
const http = require("http")
const app = express()
const cors = require("cors")
const dotenv = require("dotenv")
const helmet = require("helmet")

dotenv.config()

const authRoutes = require("./routes/authRoutes")
const studentRoutes = require("./routes/studentRoutes")
const excelRoutes = require("./routes/excelRoutes")
const programRoutes = require("./routes/programRoutes")
const attendanceRoutes = require("./routes/attendanceRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const studentDashboardRoutes = require("./routes/studentDashboardRoutes")
const assignmentRoutes = require("./routes/assignmentRoutes")
const performanceRoutes = require("./routes/performanceRoutes")
const analyticsRoutes = require("./routes/analyticsRoutes.js")
const analyticsAIRoutes = require("./routes/analyticsAIRoutes")
const studentAIRoutes = require("./routes/studentAIRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const certificateRoutes = require("./routes/certificateRoutes")
const attendanceSessionRoutes = require("./routes/attendanceSessionRoutes")
const messageRoutes = require("./routes/messageRoutes")
const gamificationRoutes = require("./routes/gamificationRoutes")
const growthCoachRoutes = require("./routes/growthCoachRoutes")
const heroSlidesRoutes = require("./routes/heroSlidesRoutes")
const { initSocket } = require("./socket")

const { connect } = require("./db/db.js")

app.use(express.json())
app.use(helmet())

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/$/, "")

const isTrustedVercelOrigin = (origin) => {
  const normalized = normalizeOrigin(origin)
  return /^https:\/\/lms-vahani1(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(normalized)
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL_LOCAL,
  process.env.CLIENT_URL_TUNNEL,
  process.env.CLIENT_URL_PROD,
  process.env.CLIENT_URL
]
  .map(normalizeOrigin)
  .filter(Boolean)

const allowedOriginSet = new Set(allowedOrigins)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = normalizeOrigin(origin)

    if (allowedOriginSet.has(normalizedOrigin)) {
      return callback(null, true)
    }

    // Allow this project's Vercel production/preview URLs in hosted environments.
    if (isTrustedVercelOrigin(normalizedOrigin)) {
      return callback(null, true)
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))

connect()
  .then(() => console.log("Database Connected"))
  .catch(err => console.log(err))

app.use("/api/auth", authRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/excel", excelRoutes)
app.use("/api/programs", programRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/student-dashboard", studentDashboardRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/assignments", assignmentRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/analytics-ai", analyticsAIRoutes)
app.use("/api/student-ai", studentAIRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/certificates", certificateRoutes)
app.use("/api/attendance-sessions", attendanceSessionRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/gamification", gamificationRoutes)
app.use("/api/growth-coach", growthCoachRoutes)
app.use("/api/hero-slides", heroSlidesRoutes)
// Note: Files are now stored on Cloudinary, no local uploads needed
// app.use("/uploads", express.static("uploads"))
app.use("/api", performanceRoutes)

app.get('/', (req, res) => {
  res.send('Backend is running and tunnel is active!');
});

const PORT = Number(process.env.PORT) || 5000

const server = http.createServer(app)
initSocket(server, allowedOrigins)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})