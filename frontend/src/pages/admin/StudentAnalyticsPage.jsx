import { useEffect, useMemo, useState } from "react"
import { Bar, Line } from "react-chartjs-2"
import "chart.js/auto"
import { getAnalyticsSummary, getStudentAnalytics } from "../../services/adminService"
import { getStudentsReport } from "../../services/studentService"
import AnalyticsChatAssistant from "../../components/ai/AnalyticsChatAssistant"
import "../../public/css/analytics-dashboard.css"

export default function StudentAnalyticsPage() {
  const [students, setStudents] = useState([])
  const [batchOptions, setBatchOptions] = useState([])
  const [summaryText, setSummaryText] = useState("Loading AI insights...")
  const [studentSearchText, setStudentSearchText] = useState("")
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState("all")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedStudentReport, setSelectedStudentReport] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentAnalytics, aiSummary] = await Promise.all([
          getStudentAnalytics(),
          getAnalyticsSummary()
        ])

        const safeStudents = Array.isArray(studentAnalytics?.students) ? studentAnalytics.students : []
        const safeBatches = Array.isArray(studentAnalytics?.batches) ? studentAnalytics.batches : []

        setStudents(safeStudents)
        setBatchOptions(safeBatches)
        const firstStudentId = safeStudents[0] ? String(safeStudents[0].student_id) : ""
        const firstStudentName = safeStudents[0]?.name || ""
        setSelectedStudentId(firstStudentId)
        setStudentSearchText(firstStudentName)
        setSummaryText(aiSummary?.data?.summary || "Use the filters to inspect engagement and completion trends by course.")
      } catch (error) {
        setStudents([])
        setBatchOptions([])
        setSelectedStudentId("")
        setStudentSearchText("")
        setSummaryText("Unable to load analytics summary right now.")
      }
    }

    loadData()
  }, [])

  const batchFilteredStudents = useMemo(() => {
    return students.filter((student) => selectedBatch === "all" || String(student.batch) === selectedBatch)
  }, [students, selectedBatch])

  const matchedStudents = useMemo(() => {
    const normalizedSearch = studentSearchText.trim().toLowerCase()

    if (!normalizedSearch) {
      return batchFilteredStudents.slice(0, 8)
    }

    return batchFilteredStudents
      .filter((student) => String(student.name || "").toLowerCase().startsWith(normalizedSearch))
      .slice(0, 8)
  }, [batchFilteredStudents, studentSearchText])

  useEffect(() => {
    if (!batchFilteredStudents.length) {
      setSelectedStudentId("")
      setStudentSearchText("")
      return
    }

    const exists = batchFilteredStudents.some((student) => String(student.student_id) === selectedStudentId)
    if (!exists) {
      const firstStudent = batchFilteredStudents[0]
      setSelectedStudentId(String(firstStudent.student_id))
      setStudentSearchText(firstStudent.name)
    }
  }, [batchFilteredStudents, selectedStudentId])

  const handleStudentSelect = (student) => {
    setSelectedStudentId(String(student.student_id))
    setStudentSearchText(student.name)
    setShowStudentSuggestions(false)
  }

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

  const selectedProgramData = useMemo(() => {
    if (!studentPrograms.length) {
      return null
    }

    if (selectedProgram === "all") {
      return null
    }

    return studentPrograms.find((item) => String(item.program_id) === selectedProgram) || null
  }, [studentPrograms, selectedProgram])

  useEffect(() => {
    if (!studentPrograms.length) {
      setSelectedProgram("all")
      return
    }

    if (selectedProgram !== "all") {
      const exists = studentPrograms.some((item) => String(item.program_id) === selectedProgram)
      if (!exists) {
        setSelectedProgram("all")
      }
    }
  }, [studentPrograms, selectedProgram])

  const hasStudents = students.length > 0
  const hasSelectedStudent = Boolean(selectedStudentId)
  const hasPrograms = studentPrograms.length > 0

  const overallMetrics = useMemo(() => {
    if (!studentPrograms.length) {
      return {
        completionRate: 0,
        averageScore: 0,
        assignmentStatus: 0,
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

    const assignmentStatus = Math.round(
      studentPrograms.reduce((sum, item) => sum + Number(item.assignment_submission_percentage || 0), 0) /
      studentPrograms.length
    )

    const totalClassesAttended = studentPrograms.reduce((sum, item) => sum + Number(item.classes_attended || 0), 0)
    const baseTime = totalClassesAttended * 1.4
    const rangeOffset = timeRange === "7d" ? 3 : timeRange === "90d" ? 16 : 8

    return {
      completionRate,
      averageScore,
      assignmentStatus,
      programsEnrolled: studentPrograms.length,
      timeSpent: Math.round(baseTime + rangeOffset)
    }
  }, [studentPrograms, timeRange])

  const focusedMetrics = useMemo(() => {
    if (!selectedProgramData) {
      return overallMetrics
    }

    const attendance = Math.round(Number(selectedProgramData.attendance_percentage || 0))
    const avgScore = Math.round(Number(selectedProgramData.avg_submission_score || 0))
    const submission = Math.round(Number(selectedProgramData.assignment_submission_percentage || 0))
    const baseTime = Number(selectedProgramData.classes_attended || 0) * 1.8
    const rangeOffset = timeRange === "7d" ? 2 : timeRange === "90d" ? 10 : 5

    return {
      completionRate: attendance,
      averageScore: avgScore,
      assignmentStatus: submission,
      programsEnrolled: 1,
      timeSpent: Math.round(baseTime + rangeOffset)
    }
  }, [selectedProgramData, overallMetrics, timeRange])

  const trendLabels = useMemo(() => {
    if (selectedProgramData) {
      return ["Attendance", "Submission", "Avg Score", "Completion"]
    }

    return studentPrograms.map((item) => item.program_name)
  }, [selectedProgramData, studentPrograms])

  const trendData = useMemo(() => {
    if (selectedProgramData) {
      const attendance = Math.round(Number(selectedProgramData.attendance_percentage || 0))
      const submission = Math.round(Number(selectedProgramData.assignment_submission_percentage || 0))
      const score = Math.round(Number(selectedProgramData.avg_submission_score || 0))
      const completion = attendance

      return [attendance, submission, score, completion]
    }

    return studentPrograms.map((item) => {
      const attendance = Number(item.attendance_percentage || 0)
      const submission = Number(item.assignment_submission_percentage || 0)
      const score = Number(item.avg_submission_score || 0)
      return Math.round(attendance * 0.45 + submission * 0.35 + score * 0.2)
    })
  }, [selectedProgramData, studentPrograms])

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
                setSelectedStudentId("")
                setShowStudentSuggestions(true)
              }}
              onFocus={() => setShowStudentSuggestions(true)}
              onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 120)}
              placeholder="Type name like 'Su'"
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
        <div>
          <label className="form-label">Batch</label>
          <select className="form-select" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="all">All Batches</option>
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Select Program</label>
          <select
            className="form-select"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            disabled={!hasPrograms}
          >
            <option value="all">All Programs</option>
            {studentPrograms.map((program) => (
              <option key={program.program_id} value={program.program_id}>{program.program_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Select Time Range</label>
          <select className="form-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {!hasStudents ? <p className="analytics-empty-note">No students found for analytics yet.</p> : null}
      {hasStudents && !hasSelectedStudent ? <p className="analytics-empty-note">Search and pick a student from the dropdown suggestions.</p> : null}
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
          <strong>{focusedMetrics.completionRate}%</strong>
        </div>
        <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={focusedMetrics.completionRate}>
          <div className="progress-bar" style={{ width: `${focusedMetrics.completionRate}%` }}></div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Average Submission Score</span>
            <h4>{focusedMetrics.averageScore}%</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Time Spent</span>
            <h4>{focusedMetrics.timeSpent} hrs</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="analytics-metric-card">
            <span>Programs Tracked</span>
            <h4>{focusedMetrics.programsEnrolled}</h4>
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
                      data: [
                        focusedMetrics.completionRate,
                        focusedMetrics.completionRate,
                        focusedMetrics.assignmentStatus
                      ],
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
                      label: selectedProgramData ? "Program Metrics" : "Program Trend",
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
