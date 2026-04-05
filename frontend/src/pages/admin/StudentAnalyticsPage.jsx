import { useEffect, useMemo, useState } from "react"
import { Bar, Line } from "react-chartjs-2"
import "chart.js/auto"
import { getAnalyticsSummary, getStudentAnalytics } from "../../services/adminService"
import { getStudentsReport } from "../../services/studentService"
import AnalyticsChatAssistant from "../../components/ai/AnalyticsChatAssistant"
import "../../public/css/analytics-dashboard.css"

export default function StudentAnalyticsPage() {
  const [students, setStudents] = useState([])
  const [summaryText, setSummaryText] = useState("Loading AI insights...")
  const [studentSearchText, setStudentSearchText] = useState("")
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedStudentReport, setSelectedStudentReport] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentAnalytics, aiSummary] = await Promise.all([
          getStudentAnalytics(),
          getAnalyticsSummary()
        ])

        const safeStudents = Array.isArray(studentAnalytics?.students) ? studentAnalytics.students : []
        setStudents(safeStudents)

        const firstStudent = safeStudents[0]
        setSelectedStudentId(firstStudent ? String(firstStudent.student_id) : "")
        setStudentSearchText(firstStudent?.name || "")

        setSummaryText(aiSummary?.data?.summary || "Use search to inspect student-level trends and outcomes.")
      } catch (error) {
        setStudents([])
        setSelectedStudentId("")
        setStudentSearchText("")
        setSummaryText("Unable to load analytics summary right now.")
      }
    }

    loadData()
  }, [])

  const matchedStudents = useMemo(() => {
    const normalizedSearch = studentSearchText.trim().toLowerCase()

    if (!normalizedSearch) {
      return students.slice(0, 8)
    }

    const startsWithMatches = students.filter((student) =>
      String(student.name || "").toLowerCase().startsWith(normalizedSearch)
    )

    return startsWithMatches.slice(0, 8)
  }, [students, studentSearchText])

  const handleStudentSelect = (student) => {
    setSelectedStudentId(String(student.student_id))
    setStudentSearchText(student.name)
    setShowStudentSuggestions(false)
  }

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId("")
      return
    }

    const exists = students.some((student) => String(student.student_id) === selectedStudentId)
    if (!exists) {
      const firstStudent = students[0]
      setSelectedStudentId(String(firstStudent.student_id))
      setStudentSearchText(firstStudent.name)
    }
  }, [students, selectedStudentId])

  useEffect(() => {
    const normalizedSearch = studentSearchText.trim().toLowerCase()
    if (!normalizedSearch) {
      return
    }

    const firstMatch = students.find((student) =>
      String(student.name || "").toLowerCase().startsWith(normalizedSearch)
    )

    if (firstMatch) {
      setSelectedStudentId(String(firstMatch.student_id))
    }
  }, [studentSearchText, students])

  useEffect(() => {
    const loadStudentReport = async () => {
      if (!selectedStudentId) {
        setSelectedStudentReport(null)
        return
      }

      try {
        const report = await getStudentsReport(selectedStudentId)
        setSelectedStudentReport(report)
      } catch (error) {
        setSelectedStudentReport(null)
      }
    }

    loadStudentReport()
  }, [selectedStudentId])

  const studentPrograms = useMemo(
    () => (Array.isArray(selectedStudentReport?.programs) ? selectedStudentReport.programs : []),
    [selectedStudentReport]
  )

  const hasStudents = students.length > 0
  const hasSelectedStudent = Boolean(selectedStudentId)
  const hasPrograms = studentPrograms.length > 0

  const metrics = useMemo(() => {
    if (!studentPrograms.length) {
      return {
        completionRate: 0,
        averageScore: 0,
        submissionRate: 0,
        programsEnrolled: 0,
        timeSpent: 0
      }
    }

    const completionRate = Math.round(
      studentPrograms.reduce((sum, item) => sum + Number(item.attendance_percentage || 0), 0) /
      studentPrograms.length
    )

    const averageScore = Math.round(
      studentPrograms.reduce((sum, item) => sum + Number(item.avg_submission_score || 0), 0) /
      studentPrograms.length
    )

    const submissionRate = Math.round(
      studentPrograms.reduce((sum, item) => sum + Number(item.assignment_submission_percentage || 0), 0) /
      studentPrograms.length
    )

    const totalClassesAttended = studentPrograms.reduce((sum, item) => sum + Number(item.classes_attended || 0), 0)

    return {
      completionRate,
      averageScore,
      submissionRate,
      programsEnrolled: studentPrograms.length,
      timeSpent: Math.round(totalClassesAttended * 1.5 + 6)
    }
  }, [studentPrograms])

  const trendLabels = useMemo(() => studentPrograms.map((item) => item.program_name), [studentPrograms])

  const trendData = useMemo(
    () =>
      studentPrograms.map((item) => {
        const attendance = Number(item.attendance_percentage || 0)
        const submission = Number(item.assignment_submission_percentage || 0)
        const score = Number(item.avg_submission_score || 0)
        return Math.round(attendance * 0.45 + submission * 0.35 + score * 0.2)
      }),
    [studentPrograms]
  )

  const selectedStudentName = useMemo(() => {
    const student = students.find((item) => String(item.student_id) === selectedStudentId)
    return student?.name || ""
  }, [students, selectedStudentId])

  return (
    <div className="dashboard-content analytics-detail-page">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="analytics-heading mb-0">Student Analytics</h2>
      </div>

      <div className="analytics-filter-strip mb-4">
        <div>
          <label className="form-label">Search Student</label>
          <div className="analytics-student-search-wrap">
            <input
              className="form-control"
              value={studentSearchText}
              onChange={(e) => {
                setStudentSearchText(e.target.value)
                setShowStudentSuggestions(true)
              }}
              onFocus={() => setShowStudentSuggestions(true)}
              onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 120)}
              placeholder="Type student name (e.g., Su...)"
            />
            {showStudentSuggestions && matchedStudents.length ? (
              <div className="analytics-student-suggestions">
                {matchedStudents.map((student) => (
                  <button
                    key={student.student_id}
                    type="button"
                    className="analytics-student-suggestion-item"
                    onMouseDown={() => handleStudentSelect(student)}
                  >
                    <span>{student.name}</span>
                    <small>Batch {student.batch ?? "-"}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!hasStudents ? <p className="analytics-empty-note">No students found for analytics yet.</p> : null}
      {hasStudents && !hasSelectedStudent ? <p className="analytics-empty-note">Search and pick a student from suggestions.</p> : null}
      {hasSelectedStudent && !hasPrograms ? <p className="analytics-empty-note">Selected student has no enrolled programs yet.</p> : null}

      {selectedStudentName ? (
        <div className="analytics-metric-card mb-3">
          <span>Selected Student</span>
          <h4>{selectedStudentName}</h4>
        </div>
      ) : null}

      <div className="analytics-progress-card mb-4">
        <div className="d-flex justify-content-between mb-2">
          <span>Course Completion</span>
          <strong>{metrics.completionRate}%</strong>
        </div>
        <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={metrics.completionRate}>
          <div className="progress-bar" style={{ width: `${metrics.completionRate}%` }}></div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Average Submission Score</span>
            <h4>{metrics.averageScore}%</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Time Spent</span>
            <h4>{metrics.timeSpent} hrs</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Programs Tracked</span>
            <h4>{metrics.programsEnrolled}</h4>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Learning Snapshot</h5>
            <div className="analytics-chart-canvas">
              <Bar
                data={{
                  labels: ["Completion", "Attendance", "Submission"],
                  datasets: [
                    {
                      label: "Percentage",
                      data: [metrics.completionRate, metrics.completionRate, metrics.submissionRate],
                      backgroundColor: ["#2563eb", "#10b981", "#f59e0b"],
                      borderRadius: 8
                    }
                  ]
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
              />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="analytics-chart-card">
            <h5>Engagement Trend</h5>
            <div className="analytics-chart-canvas">
              <Line
                data={{
                  labels: trendLabels,
                  datasets: [
                    {
                      label: "Program Trend",
                      data: trendData,
                      tension: 0.35,
                      borderColor: "#0b0d47",
                      backgroundColor: "rgba(11,13,71,0.12)",
                      fill: true
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

      <div className="analytics-ai-insight">
        <h5>AI Insights</h5>
        <p>{summaryText}</p>
        <ul>
          <li>Learners with consistent attendance above 80% show stronger completion outcomes.</li>
          <li>Assignment consistency improves when weekly learning time is above 6 hours.</li>
          <li>Students with steady submission scores show lower drop-off risk in later modules.</li>
        </ul>
      </div>

      <AnalyticsChatAssistant />
    </div>
  )
}
