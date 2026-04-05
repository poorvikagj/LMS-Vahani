import { useEffect, useState } from "react"
import API from "../../services/api"
import "../../public/css/dashboard.css"
import "../../public/css/analytics-dashboard.css"
import { toast } from "react-toastify"
import { Bar, Doughnut } from "react-chartjs-2"
import "chart.js/auto"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function StudentDashboard() {
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [pendingAssignments, setPendingAssignments] = useState(0)
  const [completedCourses, setCompletedCourses] = useState(0)
  const [attendance, setAttendance] = useState(0)
  const [upcomingPrograms, setUpcomingPrograms] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      setUpcomingPrograms(Array.isArray(data.upcomingPrograms) ? data.upcomingPrograms : [])
      setUpcomingDeadlines(Array.isArray(data.upcomingDeadlines) ? data.upcomingDeadlines : [])
    } catch (err) {
      console.log(err)
      toast.error("Failed to load dashboard")
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

  const completionRate = pendingAssignments + completedCourses
    ? Math.round((completedCourses * 100) / (pendingAssignments + completedCourses))
    : 0

  const deadlineLabels = upcomingDeadlines.slice(0, 6).map((item) => item.title)
  const deadlineDaysLeft = upcomingDeadlines.slice(0, 6).map((item) => {
    const diff = new Date(item.deadline).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  const submissionBreakdown = [completedCourses, pendingAssignments]

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Student Dashboard</h2>
        <p className="analytics-subheading mb-0">Track your programs, assignment deadlines, and learning performance in one place.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="analytics-summary-tile">
            <span className="label">Enrolled Programs</span>
            <h4>{enrolledCount}</h4>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="analytics-summary-tile">
            <span className="label">Pending Assignments</span>
            <h4>{pendingAssignments}</h4>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="analytics-summary-tile">
            <span className="label">Completed Submissions</span>
            <h4>{completedCourses}</h4>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="analytics-summary-tile">
            <span className="label">Attendance</span>
            <h4>{attendance}%</h4>
          </div>
        </div>
      </div>

      <div className="analytics-progress-card mb-4">
        <div className="d-flex justify-content-between mb-2">
          <span>Submission Completion</span>
          <strong>{completionRate}%</strong>
        </div>
        <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completionRate}>
          <div className="progress-bar" style={{ width: `${completionRate}%` }}></div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Upcoming Submission Deadlines</h5>
            <div className="analytics-chart-canvas">
              {deadlineLabels.length ? (
                <Bar
                  data={{
                    labels: deadlineLabels,
                    datasets: [
                      {
                        label: "Days Left",
                        data: deadlineDaysLeft,
                        backgroundColor: "#2563eb",
                        borderRadius: 8
                      }
                    ]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              ) : (
                <p className="analytics-empty-note">No pending submission deadlines.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Submission Overview</h5>
            <div className="analytics-chart-canvas">
              <Doughnut
                data={{
                  labels: ["Completed", "Pending"],
                  datasets: [
                    {
                      data: submissionBreakdown,
                      backgroundColor: ["#16a34a", "#f59e0b"]
                    }
                  ]
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Upcoming Programs</h5>
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Program</th>
                    <th>Incharge</th>
                    <th>Next Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPrograms.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center">No upcoming programs found.</td>
                    </tr>
                  ) : (
                    upcomingPrograms.map((program) => (
                      <tr key={program.program_id}>
                        <td>{program.program_name}</td>
                        <td>{program.program_incharge || "-"}</td>
                        <td>{program.next_deadline ? new Date(program.next_deadline).toLocaleDateString("en-GB") : "No deadline"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Last Date of Every Pending Submission</h5>
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Assignment</th>
                    <th>Program</th>
                    <th>Last Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDeadlines.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center">No pending submissions.</td>
                    </tr>
                  ) : (
                    upcomingDeadlines.map((assignment) => (
                      <tr key={assignment.assignment_id}>
                        <td>{assignment.title}</td>
                        <td>{assignment.program_name}</td>
                        <td>{new Date(assignment.deadline).toLocaleDateString("en-GB")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <StudentChatAssistant />
    </div>
  )
}
