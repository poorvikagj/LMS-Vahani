import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Bar } from "react-chartjs-2"
import "chart.js/auto"
import API from "../../services/api"
import '../../public/css/dashboard.css'

export default function AdminDashboard() {

    const [stats, setStats] = useState({
        ongoingPrograms: 0,
        totalStudents: 0,
        totalEnrollments: 0
    })

    const [analytics, setAnalytics] = useState([])
    const [students, setStudents] = useState([])
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchStats()
        fetchAnalytics()
        fetchStudents()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await API.get("/dashboard/stats")
            setStats(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const res = await API.get("/dashboard/analytics")
            setAnalytics(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const fetchStudents = async () => {
        try {
            const res = await API.get("/students")
            setStudents(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    )

    const chartData = {
        labels: analytics.map(a => a.program_name),
        datasets: [
            {
                label: "Students Enrolled",
                data: analytics.map(a => a.enrolled),
                backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"]
            }
        ]
    }

    return ( <>
            <div className="dashboard-content">
                <h2 className="mb-3 text-center">Admin Dashboard</h2>

                <div className="row mb-4">

                    <div className="col-md-4">
                        <div className="card bg-primary text-white text-center shadow">
                            <div className="card-body">
                                <h5>Ongoing Programs</h5>
                                <h2>{stats.ongoingPrograms}</h2>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card bg-success text-white text-center shadow">
                            <div className="card-body">
                                <h5>Total Students</h5>
                                <h2>{stats.totalStudents}</h2>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card bg-warning text-dark text-center shadow">
                            <div className="card-body">
                                <h5>Total Enrollments</h5>
                                <h2>{stats.totalEnrollments}</h2>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Action Buttons */}

                <div className="mb-4">

                    <Link to="/create-program">
                        <button className="btn btn-primary me-2">
                            Create Program
                        </button>
                    </Link>

                    <Link to="/manage-students">
                        <button className="btn btn-success me-2">
                            Manage Students
                        </button>
                    </Link>

                    <Link to="/manage-assignments">
                        <button className="btn btn-warning">
                            Manage Assignments
                        </button>
                    </Link>

                </div>

                {/* Analytics Chart */}

                <div className="card shadow mb-4">

                    <div className="card-body">

                        <h5 className="mb-3">Program Analytics</h5>

                        <Bar data={chartData} />

                    </div>

                </div>

                {/* Student Search */}

                <div className="card shadow mb-5">

                    <div className="card-body">

                        <h5 className="mb-3">Search Students</h5>

                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Search student name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <table className="table table-bordered">

                            <thead className="table-dark">

                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredStudents.map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.name}</td>
                                        <td>{s.email}</td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>
            </div>
        </>

    )

}