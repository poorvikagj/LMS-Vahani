import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Doughnut } from "react-chartjs-2"
import "chart.js/auto"
import API from "../../services/api"
import '../../public/css/dashboard.css'
import { toast } from "react-toastify"

export default function AdminDashboard() {

    const [stats, setStats] = useState({
        ongoingPrograms: 0,
        totalStudents: 0,
        totalEnrollments: 0,
        pendingReviews: 0,
        completionRate: 0
    })

    const [analytics, setAnalytics] = useState([])

    useEffect(() => {
        fetchStats()
        fetchAnalytics()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await API.get("/dashboard/stats")
            setStats(res.data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load dashboard stats")
        }
    }

    const fetchAnalytics = async () => {
        try {
            const res = await API.get("/dashboard/analytics")
            setAnalytics(res.data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load analytics")
        }
    }

    const enrollmentData = {
        labels: analytics.map((item) => item.program_name),
        datasets: [
            {
                data: analytics.map((item) => item.enrolled),
                backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"],
                borderWidth: 0
            }
        ]
    }
    return (
        <div className="dashboard-content">

            {/* 🔷 HEADER */}
            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">Admin Dashboard</h2>
                <p className="analytics-subheading mb-0"></p>
            </div>

            {/* 🔷 STATS GRID */}
            <div className="stats-grid">

                <div className="stat-box primary">
                    <h3>{stats.totalStudents}</h3>
                    <p>Total Scholars</p>
                </div>

                <div className="stat-box success">
                    <h3>{stats.ongoingPrograms}</h3>
                    <p>Active Programs</p>
                </div>

                <div className="stat-box warning">
                    <h3>{stats.totalEnrollments}</h3>
                    <p>Total Enrollments</p>
                </div>

                <div className="stat-box gray">
                    <h3>{stats.pendingReviews || 0}</h3>
                    <p>Pending Reviews</p>
                </div>

            </div>

            {/* 🔷 ACTION BUTTONS */}
            <div className="action-bar mb-4">

                <Link to="/create-program">
                    <button className="btn btn-primary">+ Program</button>
                </Link>

                <Link to="/manage-students">
                    <button className="btn btn-success">Students</button>
                </Link>

                <Link to="/manage-assignments">
                    <button className="btn btn-warning">Assignments</button>
                </Link>

            </div>

            {/* 🔷 MAIN GRID */}
            <div className="dashboard-grid">

                {/* 🎓 PROGRESS COMBO */}
                <div className="card shadow p-3">
                    <h5 className="mb-3">Program Enrollment Share</h5>
                    <div className="combo-chart" style={{ maxWidth: "300px", margin: "0 auto" }}>
                        <Doughnut data={enrollmentData} options={{ maintainAspectRatio: true, aspectRatio: 1.2 }} />
                    </div>
                </div>

                {/* 📈 PROGRESS PANEL */}
                <div className="card shadow p-3">
                    <h5 className="mb-3">Program Enrollments</h5>

                    {analytics.map((p, i) => {
                        const percent = stats.totalStudents
                            ? (p.enrolled / stats.totalStudents) * 100
                            : 0

                        return (
                            <div key={i} className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>{p.program_name}</span>
                                    <span>{p.enrolled}</span>
                                </div>

                                <div className="progress">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}

                </div>

            </div>

        </div>
    )
}