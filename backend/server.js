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

const { connect } = require("./db/db")

app.use(express.json())

app.use(cors({
origin:"http://localhost:3000",
credentials:true
}))

connect()
.then(()=>console.log("Database Connected"))
.catch(err=>console.log(err))

app.use("/api/auth",authRoutes)
app.use("/api/students",studentRoutes)
app.use("/api/excel",excelRoutes)
app.use("/api/programs",programRoutes)
app.use("/api/dashboard",dashboardRoutes)
app.use("/api/attendance",attendanceRoutes)

app.listen(5000,()=>{
console.log("Server running on port 5000")
})