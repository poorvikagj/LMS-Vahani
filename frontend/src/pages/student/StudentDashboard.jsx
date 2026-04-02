import { useState, useEffect } from "react"
import { useSearchParams, useLocation } from "react-router-dom"
import API from "../../services/api"
import '../../public/css/dashboard.css'
import { toast } from "react-toastify"

export default function StudentDashboard() {

    const [enrolledCount, setEnrolledCount] = useState(0)
    const [pendingAssignments, setPendingAssignments] = useState(0)
    const [completedCourses, setCompletedCourses] = useState(0)
    const [attendance, setAttendance] = useState(0)

    const [loading, setLoading] = useState(true)

    const [searchParams] = useSearchParams()
    const location = useLocation()

    useEffect(() => {

        const token = searchParams.get("token")

        if (token) {
            localStorage.setItem("token", token)
            localStorage.setItem("role", "student")
            window.history.replaceState({}, document.title, "/student-dashboard")
        }

        fetchDashboardData()

    }, [])

    const fetchDashboardData = async () => {

        try {

            const res = await API.get("/student-dashboard")

            const data = res.data || {}

            setEnrolledCount(data.totalPrograms || 0)
            setPendingAssignments(data.pendingAssignments || 0)
            setCompletedCourses(data.completedAssignments || 0)
            setAttendance(Math.round(data.attendancePercentage || 0))

        } catch (err) {

            console.log("Dashboard error:", err.response?.data || err.message)
            toast.error(err.response?.data?.error || "Failed to load dashboard data")
        } finally {

            setLoading(false)

        }

    }

    if (loading) {
        return (
            <div className="dashboard-content">
                <h3 className="text-center text-muted">Loading dashboard...</h3>
            </div>
        )
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Student Dashboard</h2>

            <div className="row">

                {/* Enrolled Programs */}
                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow">
                        <div className="card-body">
                            <h5>Enrolled Programs</h5>
                            <h2>{enrolledCount}</h2>
                        </div>
                    </div>
                </div>

                {/* Pending Assignments */}
                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow">
                        <div className="card-body">
                            <h5>Pending Assignments</h5>
                            <h2>{pendingAssignments}</h2>
                        </div>
                    </div>
                </div>

                {/* Completed Courses */}
                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow">
                        <div className="card-body">
                            <h5>Completed Courses</h5>
                            <h2>{completedCourses}</h2>
                        </div>
                    </div>
                </div>

                {/* Attendance */}
                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow">
                        <div className="card-body">
                            <h5>Attendance %</h5>
                            <h2>{attendance}%</h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Summary */}
            <div className="card shadow mt-4 p-3">
                <h5 className="mb-3">Summary</h5>
                <p>
                    You are enrolled in <b>{enrolledCount}</b> programs. <br />
                    You have <b>{pendingAssignments}</b> pending assignments. <br />
                    Your attendance is <b>{attendance}%</b>.
                </p>
            </div>

        </div>
    )
}