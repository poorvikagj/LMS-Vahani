import { useState, useEffect } from "react"
import { Doughnut } from "react-chartjs-2"
import "chart.js/auto"
import API from "../../services/api"
import '../../public/css/dashboard.css'
import { toast } from "react-toastify"

export default function StudentDashboard() {

    const [stats, setStats] = useState({
        totalPrograms: 0,
        pendingAssignments: 0,
        completedAssignments: 0,
        attendance: 0
    })

    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
        fetchPrograms()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await API.get("/student-dashboard")
            const data = res.data || {}

            setStats({
                totalPrograms: data.totalPrograms || 0,
                pendingAssignments: data.pendingAssignments || 0,
                completedAssignments: data.completedAssignments || 0,
                attendance: Math.round(data.attendancePercentage || 0)
            })

        } catch (err) {
            console.log(err)
            toast.error("Failed to load dashboard")
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        try {
            const res = await API.get("/programs/my-programs")
            setPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    /* 🎯 Donut Chart Data */
    const donutData = {
        labels: ["Completed", "Pending"],
        datasets: [
            {
                data: [
                    stats.completedAssignments,
                    stats.pendingAssignments
                ],
                backgroundColor: ["#22c55e", "#f59e0b"],
                borderWidth: 0
            }
        ]
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

            {/* 🔷 HEADER */}
            <h2 className="text-center mb-4 fw-bold">Student Dashboard</h2>

            {/* 🔷 STATS */}
            <div className="stats-grid">

                <div className="stat-box primary">
                    <h3>{stats.totalPrograms}</h3>
                    <p>Enrolled Programs</p>
                </div>

                <div className="stat-box warning">
                    <h3>{stats.pendingAssignments}</h3>
                    <p>Pending Assignments</p>
                </div>

                <div className="stat-box success">
                    <h3>{stats.completedAssignments}</h3>
                    <p>Completed</p>
                </div>

                <div className="stat-box dark">
                    <h3>{stats.attendance}%</h3>
                    <p>Attendance</p>
                </div>

            </div>

            {/* 🔷 MAIN GRID */}
            <div className="dashboard-grid">

                {/* 📊 PROGRESS COMBO */}
                <div className="card shadow p-3">
                    <h5 className="mb-3">Assignment Progress</h5>

                    <div className="combo-container">

                        <div className="combo-chart">
                            <Doughnut data={donutData} />
                        </div>

                        <div className="combo-bars">

                            <div className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>Completed</span>
                                    <strong>{stats.completedAssignments}</strong>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-success"
                                        style={{
                                            width: `${(stats.completedAssignments / (stats.completedAssignments + stats.pendingAssignments || 1)) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="d-flex justify-content-between">
                                    <span>Pending</span>
                                    <strong>{stats.pendingAssignments}</strong>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-warning"
                                        style={{
                                            width: `${(stats.pendingAssignments / (stats.completedAssignments + stats.pendingAssignments || 1)) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* 📚 PROGRAM LIST */}
                <div className="card shadow p-3">
                    <h5 className="mb-3">My Programs</h5>

                    {programs.length === 0 ? (
                        <p>No programs enrolled</p>
                    ) : (
                        programs.map((p, i) => (
                            <div key={i} className="mb-3">

                                <div className="d-flex justify-content-between">
                                    <span>{p.program_name}</span>
                                    <span>{p.total_class} classes</span>
                                </div>

                                <div className="progress mt-1">
                                    <div
                                        className="progress-bar"
                                        style={{ width: "60%" }} // optional dynamic later
                                    ></div>
                                </div>

                            </div>
                        ))
                    )}

                </div>

            </div>

            {/* 🔷 SUMMARY */}
            <div className="card shadow mt-4 p-3">
                <h5 className="mb-3">Summary</h5>

                <p>
                    You are enrolled in <b>{stats.totalPrograms}</b> programs.<br />
                    You have <b>{stats.pendingAssignments}</b> pending assignments.<br />
                    Your attendance is <b>{stats.attendance}%</b>.
                </p>

            </div>

        </div>
    )
}