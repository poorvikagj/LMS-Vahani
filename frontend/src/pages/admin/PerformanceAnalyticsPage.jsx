import { useEffect, useMemo, useState } from "react"
import { Bar } from "react-chartjs-2"
import "chart.js/auto"
import { getAnalytics, getAnalyticsSummary, getStudentAnalytics } from "../../services/adminService"
import AnalyticsChatAssistant from "../../components/ai/AnalyticsChatAssistant"
import "../../public/css/analytics-dashboard.css"

export default function PerformanceAnalyticsPage() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [batchOptions, setBatchOptions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedBatch, setSelectedBatch] = useState("all")
  const [summaryText, setSummaryText] = useState("Loading AI trend analysis...")

  useEffect(() => {
    const load = async () => {
      try {
        const [analytics, studentAnalytics, aiSummary] = await Promise.all([
          getAnalytics(),
          getStudentAnalytics(),
          getAnalyticsSummary()
        ])

        const safe = Array.isArray(analytics) ? analytics : []
        const safeStudents = Array.isArray(studentAnalytics?.students) ? studentAnalytics.students : []
        const safeBatches = Array.isArray(studentAnalytics?.batches) ? studentAnalytics.batches : []

        setCourses(safe)
        setStudents(safeStudents)
        setBatchOptions(safeBatches)
        setSummaryText(aiSummary?.data?.summary || "Use filters to compare class distribution and identify intervention opportunities.")
      } catch (error) {
        setCourses([])
        setStudents([])
        setBatchOptions([])
        setSummaryText("Unable to load performance trend summary right now.")
      }
    }

    load()
  }, [])

  useEffect(() => {
    const loadFilteredStudents = async () => {
      try {
        const response = await getStudentAnalytics({
          program_id: selectedCourse,
          batch: selectedBatch
        })

        setStudents(Array.isArray(response?.students) ? response.students : [])
      } catch (error) {
        setStudents([])
      }
    }

    loadFilteredStudents()
  }, [selectedCourse, selectedBatch])

  const hasCourses = courses.length > 0
  const hasStudents = students.length > 0

  const leaderboard = useMemo(
    () =>
      [...students]
        .sort((a, b) => Number(b.performance_score || 0) - Number(a.performance_score || 0))
        .slice(0, 8),
    [students]
  )

  const classAverage = useMemo(() => {
    if (!students.length) {
      return 0
    }

    const totalScore = students.reduce((sum, item) => sum + Number(item.performance_score || 0), 0)
    return Math.round(totalScore / students.length)
  }, [students])

  const scoreBuckets = useMemo(() => {
    const buckets = [0, 0, 0, 0]

    students.forEach((student) => {
      const score = Number(student.performance_score || 0)
      if (score >= 90) {
        buckets[0] += 1
      } else if (score >= 75) {
        buckets[1] += 1
      } else if (score >= 60) {
        buckets[2] += 1
      } else {
        buckets[3] += 1
      }
    })

    return buckets
  }, [students])

  return (
    <div className="dashboard-content analytics-detail-page">
      <h2 className="analytics-heading mb-3">Performance Analytics</h2>

      <div className="analytics-filter-strip mb-4">
        <div>
          <label className="form-label">Select Course</label>
          <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.program_id} value={course.program_id}>{course.program_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Select Batch/Class</label>
          <select className="form-select" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="all">All Batches</option>
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>
      </div>

      {!hasCourses ? <p className="analytics-empty-note">No admin-created courses found yet.</p> : null}
      {hasCourses && !hasStudents ? <p className="analytics-empty-note">No student performance records match the selected filters.</p> : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div className="analytics-chart-card h-100">
            <h5>Leaderboard</h5>
            <div className="leaderboard-list">
              {leaderboard.map((student, idx) => (
                <div key={student.student_id} className="leaderboard-item">
                  <div>
                    <strong>#{idx + 1}</strong> {student.name}
                  </div>
                  <span>{Math.round(Number(student.performance_score || 0))}%</span>
                </div>
              ))}
              {!leaderboard.length ? <p className="analytics-empty-note mb-0">No leaderboard data available.</p> : null}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="analytics-chart-card">
            <h5>Score Distribution</h5>
            <div className="analytics-chart-canvas">
              <Bar
                data={{
                  labels: ["90-100", "75-89", "60-74", "Below 60"],
                  datasets: [{
                    label: "Students",
                    data: scoreBuckets,
                    backgroundColor: ["#16a34a", "#2563eb", "#f59e0b", "#dc2626"],
                    borderRadius: 8
                  }]
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-metric-card mb-4">
        <span>Class Average</span>
        <h4>{classAverage}%</h4>
      </div>

      <div className="analytics-ai-insight">
        <h5>AI Trend Analysis</h5>
        <p>{summaryText}</p>
        <ul>
          <li>High performers are grouped around strong consistency in attendance and submissions.</li>
          <li>Mid-performing learners benefit most from targeted revision checkpoints.</li>
          <li>Lower-performing groups can improve with weekly intervention and peer study cohorts.</li>
        </ul>
      </div>

      <AnalyticsChatAssistant />
    </div>
  )
}
