import { useEffect, useMemo, useState } from "react"
import { Bar, Line } from "react-chartjs-2"
import "chart.js/auto"
import { getAnalytics, getAnalyticsSummary } from "../../services/adminService"
import { getPrograms } from "../../services/programService"
import AnalyticsChatAssistant from "../../components/ai/AnalyticsChatAssistant"
import "../../public/css/analytics-dashboard.css"

export default function ProgramAnalyticsPage() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [summaryText, setSummaryText] = useState("Loading AI summary...")

  useEffect(() => {
    const load = async () => {
      try {
        const [programList, analyticsList, aiSummary] = await Promise.all([
          getPrograms(),
          getAnalytics(),
          getAnalyticsSummary()
        ])

        const programsArray = Array.isArray(programList) ? programList : []
        const analyticsArray = Array.isArray(analyticsList) ? analyticsList : []

        const analyticsMap = new Map(
          analyticsArray.map((row) => [
            Number(row.program_id),
            {
              total_students: Number(row.total_students || 0),
              classes_completed: Number(row.classes_completed || 0),
              avg_attendance_percentage: Number(row.avg_attendance_percentage || 0),
              overall_submission_rate: Number(row.overall_submission_rate || 0)
            }
          ])
        )

        const mergedPrograms = programsArray.map((program) => {
          const stats = analyticsMap.get(Number(program.program_id)) || {
            total_students: 0,
            classes_completed: 0,
            avg_attendance_percentage: 0,
            overall_submission_rate: 0
          }

          return {
            program_id: Number(program.program_id),
            program_name: program.program_name,
            total_class: Number(program.total_class || 0),
            ...stats
          }
        })

        setPrograms(mergedPrograms)
        setSummaryText(aiSummary?.data?.summary || "Program-level analytics generated from attendance, submission, and performance patterns.")
      } catch (error) {
        setPrograms([])
        setSummaryText("Program analytics summary is temporarily unavailable.")
      }
    }

    load()
  }, [])

  const hasPrograms = programs.length > 0

  const filteredPrograms = useMemo(() => {
    if (selectedProgram === "all") return programs
    return programs.filter((item) => String(item.program_id) === selectedProgram)
  }, [programs, selectedProgram])

  const totals = useMemo(() => {
    const totalStudents = filteredPrograms.reduce((sum, p) => sum + Number(p.total_students || 0), 0)
    const avgAttendance = filteredPrograms.length
      ? filteredPrograms.reduce((sum, p) => sum + Number(p.avg_attendance_percentage || 0), 0) / filteredPrograms.length
      : 0
    const avgSubmission = filteredPrograms.length
      ? filteredPrograms.reduce((sum, p) => sum + Number(p.overall_submission_rate || 0), 0) / filteredPrograms.length
      : 0
    const performanceIndex = (avgAttendance * 0.55) + (avgSubmission * 0.45)

    return {
      totalStudents,
      avgAttendance: avgAttendance.toFixed(1),
      avgSubmission: avgSubmission.toFixed(1),
      performanceIndex: performanceIndex.toFixed(1)
    }
  }, [filteredPrograms])

  const chartLabels = filteredPrograms.map((p) => p.program_name)

  const trendSeries = filteredPrograms.map((p) => {
    const attendance = Number(p.avg_attendance_percentage || 0)
    const submission = Number(p.overall_submission_rate || 0)
    return Math.round((attendance * 0.55) + (submission * 0.45))
  })

  return (
    <div className="dashboard-content analytics-detail-page">
      <h2 className="analytics-heading mb-3">Program Analytics</h2>

      <div className="analytics-filter-strip mb-4">
        <div>
          <label className="form-label">Select Program</label>
          <select className="form-select" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
            <option value="all">All Programs</option>
            {programs.map((program) => (
              <option key={program.program_id} value={program.program_id}>{program.program_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!hasPrograms ? <p className="analytics-empty-note">No programs found for analytics yet.</p> : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="analytics-metric-card h-100">
            <span>Total Students</span>
            <h4>{totals.totalStudents}</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="analytics-metric-card h-100">
            <span>Avg Attendance</span>
            <h4>{totals.avgAttendance}%</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="analytics-metric-card h-100">
            <span>Avg Score</span>
            <h4>{totals.avgSubmission}%</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="analytics-metric-card h-100">
            <span>Performance Index</span>
            <h4>{totals.performanceIndex}</h4>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="analytics-chart-card">
            <h5>Program Attendance and Score Comparison</h5>
            <div className="analytics-chart-canvas">
              <Bar
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: "Attendance %",
                      data: filteredPrograms.map((p) => Number(p.avg_attendance_percentage || 0)),
                      backgroundColor: "#2563eb",
                      borderRadius: 8
                    },
                    {
                      label: "Submission Score %",
                      data: filteredPrograms.map((p) => Number(p.overall_submission_rate || 0)),
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
            <h5>Program Performance Trend</h5>
            <div className="analytics-chart-canvas">
              <Line
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: "Performance Index",
                      data: trendSeries,
                      borderColor: "#0b0d47",
                      backgroundColor: "rgba(11,13,71,0.14)",
                      fill: true,
                      tension: 0.3
                    }
                  ]
                }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-ai-insight">
        <h5>AI Program Insights</h5>
        <p>{summaryText}</p>
        <ul>
          <li>Attendance and assignment completion are combined to evaluate program health.</li>
          <li>Programs with lower attendance but stronger scores indicate selective engagement patterns.</li>
          <li>Use this view to prioritize interventions for low-index programs.</li>
        </ul>
      </div>

      <AnalyticsChatAssistant />
    </div>
  )
}
