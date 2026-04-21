import { useEffect, useState } from "react"
import API from "../../services/api"
import "../../public/css/dashboard.css"
import "../../public/css/analytics-dashboard.css"
import { toast } from "react-toastify"
import { Doughnut } from "react-chartjs-2"
import "chart.js/auto"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"
import LiveNotificationBar from "../../components/student/LiveNotificationBar"
import { awardGamificationPoints, getGamificationProfile, getGrowthCoach } from "../../services/engagementService"

export default function StudentDashboard() {
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [pendingAssignments, setPendingAssignments] = useState(0)
  const [completedCourses, setCompletedCourses] = useState(0)
  const [attendance, setAttendance] = useState(0)
  const [upcomingPrograms, setUpcomingPrograms] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [loading, setLoading] = useState(true)
  const [gamification, setGamification] = useState(null)
  const [coach, setCoach] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    initEngagement()
  }, [])

  const initEngagement = async () => {
    try {
      await awardGamificationPoints("daily_login")
      const [profile, coachData] = await Promise.all([
        getGamificationProfile(),
        getGrowthCoach()
      ])
      setGamification(profile)
      setCoach(coachData)
    } catch {
      // non-blocking
    }
  }

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

  const submissionBreakdown = [completedCourses, pendingAssignments]

  return (
    <div className="dashboard-content">
      <LiveNotificationBar />

      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Student Academic Dashboard</h2>
        <p className="analytics-subheading mb-0">View your enrolled programs, submission timelines, attendance metrics, and academic progress in one consolidated workspace.</p>
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
            <div className="student-deadline-calendar">
              {upcomingDeadlines.length ? (
                upcomingDeadlines.slice(0, 8).map((item) => {
                  const deadlineDate = new Date(item.deadline)
                  return (
                    <div className="student-deadline-event" key={item.assignment_id}>
                      <div className="student-deadline-datebox">
                        <span className="month">{deadlineDate.toLocaleDateString("en-US", { month: "short" })}</span>
                        <strong>{deadlineDate.getDate()}</strong>
                      </div>
                      <div className="student-deadline-details">
                        <h6>{item.title}</h6>
                        <small>{item.program_name}</small>
                      </div>
                    </div>
                  )
                })
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

      <div className="row g-3 mt-1">
        <div className="col-12 col-lg-4">
          <div className="analytics-chart-card">
            <h5>Gamification</h5>
            {gamification ? (
              <>
                <p className="mb-1">Points: <strong>{gamification.points}</strong></p>
                <p className="mb-1">Streak: <strong>{gamification.streak_days}</strong> days</p>
                <p className="mb-0">Badges: <strong>{Array.isArray(gamification.badges) && gamification.badges.length ? gamification.badges.join(", ") : "None"}</strong></p>
              </>
            ) : (
              <p className="analytics-empty-note mb-0">Loading engagement stats...</p>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="analytics-chart-card">
            <h5>AI Growth Coach</h5>
            {coach ? (
              <>
                <p className="mb-1">Attendance Status: <strong>{coach.attendancePercentage}%</strong></p>
                <p className="mb-1">Pending Work: <strong>{coach.pendingAssignments}</strong> assignments</p>
                <p className="mb-2">Average Score: <strong>{coach.averageScore}</strong></p>

                <div className="mb-2">
                  <strong>Recommended Next Actions</strong>
                  <ul className="mb-1">
                    {coach.recommendedActions?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>

                <div>
                  <strong>Risk Alerts</strong>
                  {coach.riskAlerts?.length ? (
                    <ul className="mb-0 text-danger">
                      {coach.riskAlerts.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="text-success mb-0">No critical risks detected.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="analytics-empty-note mb-0">Loading AI coach insights...</p>
            )}
          </div>
        </div>
      </div>

      <StudentChatAssistant />
    </div>
  )
}
