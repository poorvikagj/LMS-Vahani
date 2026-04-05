import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { getStudentsReport } from "../../services/studentService"
import { toast } from "react-toastify"
import "../../public/css/analytics-dashboard.css"

export default function StudentReport() {

    const { id } = useParams()
    const [report, setReport] = useState(null)

    useEffect(() => {
        fetchReport()
    }, [])

    const fetchReport = async () => {
        try {
            const data = await getStudentsReport(id)
            setReport(data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load report")
        }
    }

    const programs = useMemo(() => (Array.isArray(report?.programs) ? report.programs : []), [report])

    const summary = useMemo(() => {
        if (!programs.length) {
            return {
                totalPrograms: 0,
                avgAttendance: 0,
                avgSubmissionRate: 0,
                avgScore: 0,
                lowPerformancePrograms: []
            }
        }

        const totalPrograms = programs.length
        const avgAttendance = programs.reduce((sum, p) => sum + Number(p.attendance_percentage || 0), 0) / totalPrograms
        const avgSubmissionRate = programs.reduce((sum, p) => sum + Number(p.assignment_submission_percentage || 0), 0) / totalPrograms
        const avgScore = programs.reduce((sum, p) => sum + Number(p.avg_submission_score || 0), 0) / totalPrograms

        const lowPerformancePrograms = programs
            .filter((p) => Number(p.attendance_percentage || 0) < 70 || Number(p.assignment_submission_percentage || 0) < 70)
            .map((p) => p.program_name)

        return {
            totalPrograms,
            avgAttendance: Number(avgAttendance.toFixed(1)),
            avgSubmissionRate: Number(avgSubmissionRate.toFixed(1)),
            avgScore: Number(avgScore.toFixed(1)),
            lowPerformancePrograms
        }
    }, [programs])

    const getStatusBadge = (attendance, submissionRate) => {
        if (attendance >= 85 && submissionRate >= 85) {
            return { label: "Excellent", className: "bg-success-subtle text-success" }
        }

        if (attendance >= 70 && submissionRate >= 70) {
            return { label: "On Track", className: "bg-primary-subtle text-primary" }
        }

        return { label: "Needs Attention", className: "bg-warning-subtle text-warning" }
    }

    if (!report) {
        return (
            <div className="dashboard-content container mt-4">
                <div className="analytics-metric-card text-center">
                    <h5 className="mb-0">Loading student report...</h5>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-content analytics-detail-page container mt-4">
            <div className="analytics-header-wrap mb-4">
                <h3 className="analytics-heading mb-1">{report.name}&apos;s Report</h3>
                <p className="analytics-subheading mb-0">
                    {report.email} | Batch {report.batch ?? "N/A"}
                </p>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="analytics-summary-tile">
                        <span className="label">Programs Enrolled</span>
                        <h4>{summary.totalPrograms}</h4>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="analytics-summary-tile">
                        <span className="label">Average Attendance</span>
                        <h4>{summary.avgAttendance}%</h4>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="analytics-summary-tile">
                        <span className="label">Submission Rate</span>
                        <h4>{summary.avgSubmissionRate}%</h4>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="analytics-summary-tile">
                        <span className="label">Average Score</span>
                        <h4>{summary.avgScore}%</h4>
                    </div>
                </div>
            </div>

            <div className="analytics-ai-insight mb-4">
                <h5>Performance Highlights</h5>
                {!programs.length ? (
                    <p className="mb-0">No enrolled program report found for this student.</p>
                ) : summary.lowPerformancePrograms.length ? (
                    <ul>
                        <li>Focus needed in: {summary.lowPerformancePrograms.join(", ")}.</li>
                        <li>Target minimum 75% attendance and 75% assignment submission in the next review cycle.</li>
                    </ul>
                ) : (
                    <ul>
                        <li>Student is consistent across enrolled programs with good attendance and submission discipline.</li>
                        <li>Maintain regular practice to improve average score further.</li>
                    </ul>
                )}
            </div>

            <div className="analytics-chart-card">
                <h5 className="mb-3">Program-wise Report</h5>
                <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Program</th>
                                <th>Attendance</th>
                                <th>Submission</th>
                                <th>Avg Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">No report data found.</td>
                                </tr>
                            ) : (
                                programs.map((p, index) => {
                                    const attendance = Number(p.attendance_percentage || 0)
                                    const submission = Number(p.assignment_submission_percentage || 0)
                                    const status = getStatusBadge(attendance, submission)

                                    return (
                                        <tr key={`${p.program_id}-${index}`}>
                                            <td>
                                                <div className="fw-semibold">{p.program_name}</div>
                                                <small className="text-muted">Classes: {p.classes_attended}/{p.total_classes}</small>
                                            </td>
                                            <td style={{ minWidth: "180px" }}>
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small>{p.classes_attended}/{p.total_classes}</small>
                                                    <small>{attendance.toFixed(1)}%</small>
                                                </div>
                                                <div className="progress" style={{ height: "8px" }}>
                                                    <div className="progress-bar bg-info" style={{ width: `${Math.min(attendance, 100)}%` }}></div>
                                                </div>
                                            </td>
                                            <td style={{ minWidth: "180px" }}>
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small>{p.assignments_submitted}/{p.total_assignments}</small>
                                                    <small>{submission.toFixed(1)}%</small>
                                                </div>
                                                <div className="progress" style={{ height: "8px" }}>
                                                    <div className="progress-bar bg-success" style={{ width: `${Math.min(submission, 100)}%` }}></div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{Number(p.avg_submission_score || 0).toFixed(1)}%</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${status.className}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}