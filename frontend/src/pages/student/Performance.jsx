import { useEffect, useState } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"
import { Bar } from "react-chartjs-2"
import "chart.js/auto"
import "../../public/css/analytics-dashboard.css"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function Performance() {

    const [performance, setPerformance] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPerformance()
    }, [])

    const fetchPerformance = async () => {
        try {

            const res = await API.get("/performance")
            setPerformance(res.data)

        } catch (err) {

            console.log(err)
            toast.error("Failed to load performance")

        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-content">
                <h3 className="text-center text-muted">Loading performance...</h3>
            </div>
        )
    }

    const submittedAssignments = performance.reduce((sum, item) => sum + Number(item.assignments_completed || 0), 0)
    const totalAssignments = performance.reduce((sum, item) => sum + Number(item.total_assignments || 0), 0)
    const pendingAssignments = Math.max(0, totalAssignments - submittedAssignments)
    const submissionCompletion = totalAssignments
        ? Math.round((submittedAssignments * 100) / totalAssignments)
        : 0

    return (
        <div className="dashboard-content">

            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">Academic Performance Overview</h2>
                <p className="analytics-subheading mb-0">Monitor your scores, attendance consistency, and assignment completion across enrolled programs.</p>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Submitted Assignments</span>
                        <h4>{submittedAssignments}</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Pending Assignments</span>
                        <h4>{pendingAssignments}</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Assignment Completion</span>
                        <h4>{submissionCompletion}%</h4>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div className="analytics-chart-card">
                        <h5>Program-wise Performance Score</h5>
                        <div className="analytics-chart-canvas">
                            <Bar
                                data={{
                                    labels: performance.map((p) => p.program_name),
                                    datasets: [
                                        {
                                            label: "Performance Score",
                                            data: performance.map((p) => Number(p.score || 0)),
                                            backgroundColor: "#2563eb",
                                            borderRadius: 8
                                        },
                                        {
                                            label: "Attendance",
                                            data: performance.map((p) => Number(p.attendance_percentage || 0)),
                                            backgroundColor: "#10b981",
                                            borderRadius: 8
                                        }
                                    ]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="analytics-chart-card">
                        <h5>Program Performance vs Benchmark</h5>
                        <div className="analytics-chart-canvas">
                            <Bar
                                data={{
                                    labels: performance.map((p) => p.program_name),
                                    datasets: [
                                        {
                                            label: "Program Score",
                                            data: performance.map((p) => Number(p.score || 0)),
                                            backgroundColor: "#2563eb",
                                            borderRadius: 8
                                        },
                                        {
                                            label: "Benchmark (75%)",
                                            data: performance.map(() => 75),
                                            backgroundColor: "#94a3b8",
                                            borderRadius: 8
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: { y: { min: 0, max: 100 } }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-chart-card">
                <h5>Detailed Program Breakdown</h5>
                <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Program</th>
                                <th>Assignments</th>
                                <th>Attendance</th>
                                <th>Average Submission Score</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performance.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">No performance data</td>
                                </tr>
                            ) : (
                                performance.map((p) => {
                                    const percent = p.total_assignments
                                        ? Math.round((p.assignments_completed / p.total_assignments) * 100)
                                        : 0

                                    return (
                                        <tr key={p.program_id || p.program_name}>
                                            <td>{p.program_name}</td>
                                            <td>{p.assignments_completed}/{p.total_assignments} ({percent}%)</td>
                                            <td>{Math.round(Number(p.attendance_percentage || 0))}%</td>
                                            <td>{Math.round(Number(p.avg_submission_score || 0))}%</td>
                                            <td><b>{Math.round(Number(p.score || 0))}%</b></td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <StudentChatAssistant />
        </div>
    )
}