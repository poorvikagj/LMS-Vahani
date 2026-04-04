const express = require("express")
const app = express()
const cors = require("cors")
const dotenv = require("dotenv")

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

const { connect } = require("./db/db.js")

app.use(express.json())

app.use(cors({
  origin: [process.env.CLIENT_URL_LOCAL, process.env.CLIENT_URL_TUNNEL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]

}))

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
app.use("/uploads", express.static("uploads"))
app.use("/api", performanceRoutes)

app.get('/', (req, res) => {
  res.send('Backend is running and tunnel is active!');
});

app.listen(5000, () => {
  console.log("Server running on port 5000")
})