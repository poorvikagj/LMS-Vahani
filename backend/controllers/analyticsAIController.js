const OpenAI = require("openai")
const { pool } = require("../db/db")

const ANALYTICS_QUERY_SQL = `
  SELECT
    p.program_id,
    p.program_name,
    ROUND(
      AVG(
        CASE
          WHEN att.status = 'Present' THEN 100.0
          ELSE 0
        END
      ), 2
    ) AS avg_attendance_percentage,
    ROUND(
      (COUNT(DISTINCT sub.submission_id) FILTER (WHERE sub.status='Submitted') * 100.0)
      / NULLIF(COUNT(DISTINCT ass.assignment_id) * COUNT(DISTINCT e.student_id), 0),
    2) AS overall_submission_rate
  FROM programs p
  LEFT JOIN enrollments e ON e.program_id = p.program_id
  LEFT JOIN attendance att ON att.program_id = p.program_id
  LEFT JOIN assignments ass ON ass.program_id = p.program_id
  LEFT JOIN submissions sub ON sub.assignment_id = ass.assignment_id
  GROUP BY p.program_id, p.program_name
  ORDER BY p.program_name
`

const getAnalyticsRows = async () => {
  const [hasPrograms, hasEnrollments, hasAttendance, hasAssignments, hasSubmissions] = await Promise.all([
    tableExists("programs"),
    tableExists("enrollments"),
    tableExists("attendance"),
    tableExists("assignments"),
    tableExists("submissions")
  ])

  if (!hasPrograms) {
    return []
  }

  if (!hasEnrollments || !hasAttendance) {
    const baseResult = await pool.query(`
      SELECT
        p.program_id,
        p.program_name,
        0::numeric AS avg_attendance_percentage,
        0::numeric AS overall_submission_rate
      FROM programs p
      ORDER BY p.program_name
    `)

    return baseResult.rows
  }

  if (!hasAssignments || !hasSubmissions) {
    const partialResult = await pool.query(`
      SELECT
        p.program_id,
        p.program_name,
        COALESCE(
          ROUND(
            AVG(CASE WHEN att.status = 'Present' THEN 100.0 ELSE 0 END),
            2
          ),
          0
        ) AS avg_attendance_percentage,
        0::numeric AS overall_submission_rate
      FROM programs p
      LEFT JOIN enrollments e ON e.program_id = p.program_id
      LEFT JOIN attendance att ON att.program_id = p.program_id
      GROUP BY p.program_id, p.program_name
      ORDER BY p.program_name
    `)

    return partialResult.rows
  }

  const analyticsResult = await pool.query(ANALYTICS_QUERY_SQL)
  return analyticsResult.rows
}

const tableExists = async (tableName) => {
  const result = await pool.query("SELECT to_regclass($1) AS regclass", [`public.${tableName}`])
  return Boolean(result.rows[0]?.regclass)
}

const getCourses = async () => {
  if (!(await tableExists("programs"))) {
    return []
  }

  const result = await pool.query("SELECT program_id, program_name, total_class FROM programs ORDER BY program_name")
  return result.rows
}

const getStudentByQuery = async (query) => {
  if (!(await tableExists("students"))) {
    return null
  }

  const text = String(query || "").trim()
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/)

  if (emailMatch?.[0]) {
    const studentResult = await pool.query(
      "SELECT student_id, name, email, batch FROM students WHERE email = $1 LIMIT 1",
      [emailMatch[0]]
    )
    return studentResult.rows[0] || null
  }

  const cleanedText = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const stopWords = new Set([
    "give", "show", "get", "details", "detail", "student", "of", "for", "about", "please", "the",
    "attendance", "program", "programs", "marks", "mark", "score", "scores", "test", "tests", "and",
    "with", "all", "what", "which", "is", "are", "me"
  ])

  const studentKeywordMatch = text.match(/student\s+([a-zA-Z\s]+)/i)
  const afterStudent = studentKeywordMatch?.[1]?.trim() || ""

  const termCandidates = []
  if (afterStudent) {
    termCandidates.push(afterStudent)
  }

  if (cleanedText) {
    termCandidates.push(cleanedText)
    const tokens = cleanedText
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stopWords.has(token))

    if (tokens.length) {
      termCandidates.push(tokens.join(" "))
      termCandidates.push(...tokens)
      termCandidates.push(tokens[tokens.length - 1])
    }
  }

  termCandidates.push(text)

  const uniqueCandidates = [...new Set(termCandidates.map((item) => String(item || "").trim()).filter(Boolean))]

  for (const term of uniqueCandidates) {
    const result = await pool.query(
      `SELECT student_id, name, email, batch
       FROM students
       WHERE name ILIKE $1
       ORDER BY CASE WHEN LOWER(name) = LOWER($2) THEN 0 ELSE 1 END, student_id DESC
       LIMIT 1`,
      [`%${term}%`, term]
    )

    if (result.rows[0]) {
      return result.rows[0]
    }
  }

  return null
}

const getStudentCourseNames = async (studentId) => {
  const hasEnrollments = await tableExists("enrollments")
  const hasPrograms = await tableExists("programs")

  if (!hasEnrollments || !hasPrograms) {
    return []
  }

  const result = await pool.query(
    `SELECT p.program_name
     FROM enrollments e
     JOIN programs p ON p.program_id = e.program_id
     WHERE e.student_id = $1
     ORDER BY p.program_name`,
    [studentId]
  )

  return result.rows.map((row) => row.program_name)
}

const getStudentFullProfile = async (studentId) => {
  const [hasEnrollments, hasPrograms, hasAssignments, hasSubmissions, hasAttendance] = await Promise.all([
    tableExists("enrollments"),
    tableExists("programs"),
    tableExists("assignments"),
    tableExists("submissions"),
    tableExists("attendance")
  ])

  if (!hasEnrollments || !hasPrograms) {
    return {
      programSummary: [],
      assessmentDetails: [],
      overall: {
        totalPrograms: 0,
        avgAttendance: 0,
        avgScore: 0,
        submittedCount: 0,
        pendingCount: 0
      }
    }
  }

  const programSummaryResult = await pool.query(
    `SELECT
      p.program_name,
      COALESCE(att.total_classes, 0) AS total_classes,
      COALESCE(att.present_classes, 0) AS present_classes,
      COALESCE(att.attendance_percentage, 0) AS attendance_percentage,
      COALESCE(ass.total_assignments, 0) AS total_assignments,
      COALESCE(sub.assignments_submitted, 0) AS assignments_submitted,
      COALESCE(sub.avg_score, 0) AS avg_score
    FROM enrollments e
    JOIN programs p ON p.program_id = e.program_id
    LEFT JOIN (
      SELECT
        student_id,
        program_id,
        COUNT(*) AS total_classes,
        COUNT(*) FILTER (WHERE status = 'Present') AS present_classes,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'Present') * 100.0 / NULLIF(COUNT(*), 0),
          2
        ) AS attendance_percentage
      FROM attendance
      WHERE student_id = $1
      GROUP BY student_id, program_id
    ) att ON att.student_id = e.student_id AND att.program_id = e.program_id
    LEFT JOIN (
      SELECT program_id, COUNT(*) AS total_assignments
      FROM assignments
      GROUP BY program_id
    ) ass ON ass.program_id = e.program_id
    LEFT JOIN (
      SELECT
        s.student_id,
        a.program_id,
        COUNT(*) FILTER (WHERE s.status = 'Submitted') AS assignments_submitted,
        ROUND(AVG(s.score) FILTER (WHERE s.status = 'Submitted' AND s.score IS NOT NULL), 2) AS avg_score
      FROM submissions s
      JOIN assignments a ON a.assignment_id = s.assignment_id
      WHERE s.student_id = $1
      GROUP BY s.student_id, a.program_id
    ) sub ON sub.student_id = e.student_id AND sub.program_id = e.program_id
    WHERE e.student_id = $1
    ORDER BY p.program_name`,
    [studentId]
  )

  let assessmentDetails = []

  if (hasAssignments && hasSubmissions) {
    const assessmentResult = await pool.query(
      `SELECT
        p.program_name,
        a.title,
        a.deadline,
        COALESCE(s.status, 'Pending') AS status,
        s.score
      FROM assignments a
      JOIN programs p ON p.program_id = a.program_id
      JOIN enrollments e ON e.program_id = a.program_id
      LEFT JOIN submissions s
        ON s.assignment_id = a.assignment_id
        AND s.student_id = $1
      WHERE e.student_id = $1
      ORDER BY a.deadline NULLS LAST, a.assignment_id DESC
      LIMIT 15`,
      [studentId]
    )

    assessmentDetails = assessmentResult.rows
  }

  const programSummary = programSummaryResult.rows
  const totalPrograms = programSummary.length
  const avgAttendance = totalPrograms
    ? Number((programSummary.reduce((sum, row) => sum + Number(row.attendance_percentage || 0), 0) / totalPrograms).toFixed(1))
    : 0

  const avgScore = totalPrograms
    ? Number((programSummary.reduce((sum, row) => sum + Number(row.avg_score || 0), 0) / totalPrograms).toFixed(1))
    : 0

  const submittedCount = assessmentDetails.filter((row) => String(row.status || "").toLowerCase() === "submitted").length
  const pendingCount = assessmentDetails.filter((row) => String(row.status || "").toLowerCase() !== "submitted").length

  return {
    programSummary,
    assessmentDetails,
    overall: {
      totalPrograms,
      avgAttendance,
      avgScore,
      submittedCount,
      pendingCount
    }
  }
}

const getDashboardSnapshot = async () => {
  const courses = await getCourses()
  const analyticsRows = await getAnalyticsRows()

  const hasStudents = await tableExists("students")
  const studentsCountResult = hasStudents
    ? await pool.query("SELECT COUNT(*)::int AS count FROM students")
    : { rows: [{ count: 0 }] }

  return {
    courses,
    analyticsRows,
    totalStudents: Number(studentsCountResult.rows[0]?.count || 0)
  }
}

const buildChatFallbackAnswer = async (query) => {
  const normalized = String(query || "").toLowerCase()
  const snapshot = await getDashboardSnapshot()

  const getProgramsWithStudentCounts = async () => {
    if (!(await tableExists("programs")) || !(await tableExists("enrollments"))) {
      return []
    }

    const result = await pool.query(
      `SELECT p.program_name, COUNT(DISTINCT e.student_id) AS student_count
       FROM programs p
       LEFT JOIN enrollments e ON e.program_id = p.program_id
       GROUP BY p.program_id, p.program_name
       ORDER BY p.program_name`
    )

    return result.rows
  }

  const getStudentsByBatch = async (batchNumber) => {
    if (!(await tableExists("students"))) {
      return []
    }

    const result = await pool.query(
      "SELECT name FROM students WHERE batch = $1 ORDER BY name",
      [batchNumber]
    )

    return result.rows.map((row) => row.name)
  }

  const getStudentsWithoutEnrollments = async () => {
    if (!(await tableExists("students")) || !(await tableExists("enrollments"))) {
      return []
    }

    const result = await pool.query(
      `SELECT s.name
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.student_id
       WHERE e.student_id IS NULL
       ORDER BY s.name`
    )

    return result.rows.map((row) => row.name)
  }

  const getAttendanceForProgram = async (programKeyword) => {
    if (!(await tableExists("programs")) || !(await tableExists("attendance"))) {
      return null
    }

    const result = await pool.query(
      `SELECT
        p.program_name,
        ROUND(AVG(CASE WHEN a.status = 'Present' THEN 100.0 ELSE 0 END), 2) AS attendance_pct
       FROM programs p
       LEFT JOIN attendance a ON a.program_id = p.program_id
       WHERE p.program_name ILIKE $1
       GROUP BY p.program_id, p.program_name
       ORDER BY p.program_name
       LIMIT 1`,
      [`%${programKeyword}%`]
    )

    return result.rows[0] || null
  }

  const topByAttendance = [...snapshot.analyticsRows].sort(
    (a, b) => Number(b.avg_attendance_percentage || 0) - Number(a.avg_attendance_percentage || 0)
  )[0]

  const lowByAttendance = [...snapshot.analyticsRows].sort(
    (a, b) => Number(a.avg_attendance_percentage || 0) - Number(b.avg_attendance_percentage || 0)
  )[0]

  const topByScore = [...snapshot.analyticsRows].sort(
    (a, b) => Number(b.overall_submission_rate || 0) - Number(a.overall_submission_rate || 0)
  )[0]

  const totalPrograms = snapshot.courses.length
  const avgAttendance = snapshot.analyticsRows.length
    ? (snapshot.analyticsRows.reduce((sum, row) => sum + Number(row.avg_attendance_percentage || 0), 0) / snapshot.analyticsRows.length).toFixed(1)
    : "0.0"

  const avgScore = snapshot.analyticsRows.length
    ? (snapshot.analyticsRows.reduce((sum, row) => sum + Number(row.overall_submission_rate || 0), 0) / snapshot.analyticsRows.length).toFixed(1)
    : "0.0"

  if (normalized.includes("how many students") || normalized.includes("total students")) {
    return `Total students in the LMS: ${snapshot.totalStudents}.`
  }

  if (normalized.includes("how many") && (normalized.includes("program") || normalized.includes("course"))) {
    return `Total admin-created programs: ${totalPrograms}.`
  }

  if (normalized.includes("show students in batch") || normalized.includes("students in batch")) {
    const batchMatch = normalized.match(/batch\s*(\d{4})/)
    if (!batchMatch) {
      return "Please specify the batch year, for example: 'Show students in batch 2024'."
    }

    const batchNumber = Number(batchMatch[1])
    const names = await getStudentsByBatch(batchNumber)

    if (!names.length) {
      return `No students found in batch ${batchNumber}.`
    }

    return `Students in batch ${batchNumber}: ${names.slice(0, 20).join(", ")}${names.length > 20 ? " ..." : ""}.`
  }

  if (normalized.includes("attendance status for")) {
    const match = normalized.match(/attendance status for\s+(.+)/)
    const keyword = match?.[1]?.trim()

    if (!keyword) {
      return "Please mention a program name, for example: 'Show attendance status for Official Test Program'."
    }

    const row = await getAttendanceForProgram(keyword)

    if (!row) {
      return "I could not find that program for attendance status."
    }

    return `Attendance status for ${row.program_name}: ${Number(row.attendance_pct || 0).toFixed(1)}% present.`
  }

  if (normalized.includes("no enrollments") || normalized.includes("without enrollment")) {
    const studentsNoEnroll = await getStudentsWithoutEnrollments()

    if (!studentsNoEnroll.length) {
      return "All students currently have at least one enrollment."
    }

    return `Students with no enrollments: ${studentsNoEnroll.slice(0, 20).join(", ")}${studentsNoEnroll.length > 20 ? " ..." : ""}.`
  }

  if (normalized.includes("active programs")) {
    const programStats = await getProgramsWithStudentCounts()
    const active = programStats.filter((row) => Number(row.student_count || 0) > 0)
    return `Active programs (with enrollments): ${active.length} out of ${programStats.length}.`
  }

  if (normalized.includes("most students") || normalized.includes("program has most students")) {
    const programStats = await getProgramsWithStudentCounts()
    const top = [...programStats].sort((a, b) => Number(b.student_count || 0) - Number(a.student_count || 0))[0]

    if (!top) {
      return "No enrollment data available yet to determine student counts by program."
    }

    return `${top.program_name} has the most students (${top.student_count}).`
  }

  if (normalized.includes("top 3 programs by score")) {
    const top3 = [...snapshot.analyticsRows]
      .sort((a, b) => Number(b.overall_submission_rate || 0) - Number(a.overall_submission_rate || 0))
      .slice(0, 3)

    if (!top3.length) {
      return "No score analytics are available yet."
    }

    return `Top 3 programs by submission score: ${top3.map((row) => `${row.program_name} (${Number(row.overall_submission_rate || 0).toFixed(1)}%)`).join(", ")}.`
  }

  if (normalized.includes("performance summary for all programs")) {
    if (!snapshot.analyticsRows.length) {
      return "No performance summary is available yet because analytics data is empty."
    }

    const summaryRows = snapshot.analyticsRows
      .map((row) => `${row.program_name}: attendance ${Number(row.avg_attendance_percentage || 0).toFixed(1)}%, score ${Number(row.overall_submission_rate || 0).toFixed(1)}%`)
      .slice(0, 8)

    return `Program performance summary: ${summaryRows.join(" | ")}${snapshot.analyticsRows.length > 8 ? " ..." : ""}.`
  }

  if (normalized.includes("flagged for intervention")) {
    const flaggedPrograms = snapshot.analyticsRows
      .filter((row) => Number(row.avg_attendance_percentage || 0) < 65 || Number(row.overall_submission_rate || 0) < 60)
      .map((row) => row.program_name)

    return flaggedPrograms.length
      ? `Programs that indicate intervention need: ${flaggedPrograms.join(", ")}.`
      : "No program currently falls below intervention thresholds."
  }

  if (normalized.includes("highest attendance") || normalized.includes("top attendance")) {
    return topByAttendance
      ? `${topByAttendance.program_name} has the highest attendance at ${Number(topByAttendance.avg_attendance_percentage || 0).toFixed(1)}%.`
      : "No attendance analytics are available yet."
  }

  if (normalized.includes("lowest attendance") || normalized.includes("low attendance")) {
    return lowByAttendance
      ? `${lowByAttendance.program_name} has the lowest attendance at ${Number(lowByAttendance.avg_attendance_percentage || 0).toFixed(1)}%.`
      : "No attendance analytics are available yet."
  }

  if (normalized.includes("highest submission") || normalized.includes("highest score") || normalized.includes("top score")) {
    return topByScore
      ? `${topByScore.program_name} has the highest submission score at ${Number(topByScore.overall_submission_rate || 0).toFixed(1)}%.`
      : "No score analytics are available yet."
  }

  if (normalized.includes("average attendance")) {
    return `Average attendance across programs is ${avgAttendance}%.`
  }

  if (normalized.includes("average score") || normalized.includes("average submission")) {
    return `Average submission score across programs is ${avgScore}%.`
  }

  if (normalized.includes("programs need attention") || normalized.includes("need attention")) {
    const flagged = snapshot.analyticsRows
      .filter((row) => Number(row.avg_attendance_percentage || 0) < 65 || Number(row.overall_submission_rate || 0) < 60)
      .map((row) => row.program_name)

    return flagged.length
      ? `Programs needing attention: ${flagged.join(", ")}.`
      : "No programs are currently flagged for attention based on attendance/score thresholds."
  }

  if (normalized.includes("weekly monitoring checklist") || normalized.includes("checklist")) {
    return "Weekly checklist: 1) Review attendance < 70%. 2) Review submission score < 60%. 3) Contact students with repeated absences. 4) Share intervention plan with program incharge."
  }

  if (normalized.includes("report summary") || normalized.includes("management")) {
    return `Management summary: total programs ${totalPrograms}, total students ${snapshot.totalStudents}, average attendance ${avgAttendance}%, average score ${avgScore}%.`
  }

  if (normalized.includes("course") || normalized.includes("courses") || normalized.includes("program") || normalized.includes("programs")) {
    const courses = await getCourses()

    if (!courses.length) {
      return "No admin-created courses are available yet. Please create courses from the Programs section first."
    }

    return `Admin-created courses are: ${courses.map((course) => course.program_name).join(", ")}.`
  }

  if (
    normalized.includes("student") ||
    normalized.includes("details") ||
    normalized.includes("detail") ||
    normalized.includes("marks") ||
    normalized.includes("mark") ||
    normalized.includes("score") ||
    normalized.includes("test")
  ) {
    const student = await getStudentByQuery(query)

    if (!student) {
      return "I could not find that student. Try the exact name or email."
    }

    const courseNames = await getStudentCourseNames(student.student_id)
    const courseText = courseNames.length ? courseNames.join(", ") : "No course enrollments yet"

    const profile = await getStudentFullProfile(student.student_id)
    const programsText = profile.programSummary.length
      ? profile.programSummary
        .slice(0, 6)
        .map((row) => `${row.program_name} (attendance ${Number(row.attendance_percentage || 0).toFixed(1)}%, submitted ${row.assignments_submitted}/${row.total_assignments}, avg score ${Number(row.avg_score || 0).toFixed(1)}%)`)
        .join("; ")
      : "No program analytics available"

    const assessmentsText = profile.assessmentDetails.length
      ? profile.assessmentDetails
        .slice(0, 6)
        .map((row) => `${row.title} [${row.program_name}] - ${row.status}${row.score !== null && row.score !== undefined ? ` (${row.score} marks)` : ""}`)
        .join("; ")
      : "No assignment/test marks found"

    return `Student details: Name: ${student.name}, Email: ${student.email}, Batch: ${student.batch || "N/A"}, Courses: ${courseText}. Overall attendance: ${profile.overall.avgAttendance}%, overall score: ${profile.overall.avgScore}%. Program-wise: ${programsText}. Recent tests/assignments: ${assessmentsText}.`
  }

  return `Current snapshot: ${totalPrograms} programs, ${snapshot.totalStudents} students, average attendance ${avgAttendance}%, average score ${avgScore}%. You can ask about batch-wise students, top programs, attendance status, or intervention lists.`
}

const parseFallbackQuery = (query) => {
  const normalized = String(query || "").toLowerCase()
  const yearMatch = normalized.match(/\b(20\d{2})\b/)

  const metric = normalized.includes("attendance")
    ? "attendance"
    : normalized.includes("assignment") || normalized.includes("submission")
      ? "submission"
      : null

  let operator = null
  if (normalized.includes("below") || normalized.includes("under") || normalized.includes("less than") || normalized.includes("<")) {
    operator = "lt"
  }
  if (normalized.includes("above") || normalized.includes("over") || normalized.includes("greater than") || normalized.includes(">")) {
    operator = "gt"
  }

  const thresholdMatch = normalized.match(/(?:below|under|less than|above|over|greater than|>|<)\s*(\d{1,3})/)
  const threshold = thresholdMatch ? Number(thresholdMatch[1]) : null

  let keyword = null
  const forMatch = normalized.match(/(?:for|in)\s+([a-z0-9\s-]+)/)
  if (forMatch?.[1]) {
    keyword = forMatch[1].trim()
  }

  return {
    metric,
    operator,
    threshold,
    year: yearMatch ? yearMatch[1] : null,
    keyword,
    intent: "filter"
  }
}

const applyParsedFilters = (rows, parsed) => {
  let filtered = [...rows]

  if (parsed?.year) {
    filtered = filtered.filter((row) => String(row.program_name || "").includes(parsed.year))
  }

  if (parsed?.keyword) {
    filtered = filtered.filter((row) => String(row.program_name || "").toLowerCase().includes(parsed.keyword.toLowerCase()))
  }

  if (parsed?.metric && parsed?.operator && Number.isFinite(parsed?.threshold)) {
    const metricKey = parsed.metric === "attendance" ? "avg_attendance_percentage" : "overall_submission_rate"
    filtered = filtered.filter((row) => {
      const value = Number(row[metricKey] || 0)
      return parsed.operator === "lt" ? value < parsed.threshold : value > parsed.threshold
    })
  }

  return filtered
}

const buildQueryExplanation = (parsed) => {
  const parts = []

  if (parsed?.metric && parsed?.operator && Number.isFinite(parsed?.threshold)) {
    const metricLabel = parsed.metric === "attendance" ? "attendance" : "submission"
    const opLabel = parsed.operator === "lt" ? "below" : "above"
    parts.push(`${metricLabel} ${opLabel} ${parsed.threshold}%`)
  }

  if (parsed?.year) {
    parts.push(`batch/year ${parsed.year}`)
  }

  if (parsed?.keyword) {
    parts.push(`matching '${parsed.keyword}'`)
  }

  if (!parts.length) {
    return "Showing analytics data without additional filters"
  }

  return `Applied filter: ${parts.join(", ")}`
}

const parseQueryWithOpenAI = async (query) => {
  if (!process.env.OPENAI_API_KEY) {
    return {
      parsed: parseFallbackQuery(query),
      generatedWith: "fallback"
    }
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "Extract analytics filter intent from admin query. Return JSON only with keys: intent, metric, operator, threshold, year, keyword. metric values: attendance|submission|null. operator values: lt|gt|null."
      },
      {
        role: "user",
        content: query
      }
    ]
  })

  const raw = completion?.choices?.[0]?.message?.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    parsed: {
      intent: parsed.intent || "filter",
      metric: ["attendance", "submission"].includes(parsed.metric) ? parsed.metric : null,
      operator: ["lt", "gt"].includes(parsed.operator) ? parsed.operator : null,
      threshold: Number.isFinite(Number(parsed.threshold)) ? Number(parsed.threshold) : null,
      year: parsed.year ? String(parsed.year) : null,
      keyword: parsed.keyword ? String(parsed.keyword) : null
    },
    generatedWith: "openai"
  }
}

const buildFallbackSummary = (programs) => {
  if (!programs.length) {
    return "No analytics data is available yet for AI summary."
  }

  const avgAttendance = programs.reduce((sum, row) => sum + Number(row.avg_attendance_percentage || 0), 0) / programs.length
  const avgSubmission = programs.reduce((sum, row) => sum + Number(row.overall_submission_rate || 0), 0) / programs.length

  const lowAttendance = [...programs]
    .sort((a, b) => Number(a.avg_attendance_percentage || 0) - Number(b.avg_attendance_percentage || 0))
    .slice(0, 2)
    .map((row) => row.program_name)
    .filter(Boolean)

  const lowAttendanceText = lowAttendance.length
    ? ` Watch attendance in ${lowAttendance.join(" and ")}.`
    : ""

  return `Average attendance is ${avgAttendance.toFixed(1)}% and assignment submission is ${avgSubmission.toFixed(1)}% across ${programs.length} programs.${lowAttendanceText}`
}

exports.getAnalyticsAISummary = async (req, res) => {
  try {
    const programs = await getAnalyticsRows()
    const fallbackSummary = buildFallbackSummary(programs)

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        data: {
          summary: fallbackSummary,
          generatedWith: "fallback"
        },
        error: null
      })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are an LMS analytics assistant. Generate one concise admin summary in 2-3 sentences with actionable insight."
          },
          {
            role: "user",
            content: `Program analytics data: ${JSON.stringify(programs)}`
          }
        ]
      })

      const summary = completion?.choices?.[0]?.message?.content?.trim() || fallbackSummary

      return res.json({
        ok: true,
        data: {
          summary,
          generatedWith: completion?.choices?.[0]?.message?.content ? "openai" : "fallback"
        },
        error: null
      })
    } catch (aiError) {
      console.log("AI summary generation failed:", aiError.message)

      return res.json({
        ok: true,
        data: {
          summary: fallbackSummary,
          generatedWith: "fallback"
        },
        error: {
          code: "AI_GENERATION_FAILED",
          message: "Fallback summary returned"
        }
      })
    }
  } catch (err) {
    console.log(err)

    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: "ANALYTICS_SUMMARY_FAILED",
        message: "Unable to generate analytics summary"
      }
    })
  }
}

exports.queryAnalyticsWithAI = async (req, res) => {
  try {
    const { query } = req.body || {}

    if (!query || !String(query).trim()) {
      return res.status(400).json({
        ok: false,
        data: null,
        error: {
          code: "INVALID_QUERY",
          message: "Query is required"
        }
      })
    }

    const rows = await getAnalyticsRows()

    let parsedResult
    try {
      parsedResult = await parseQueryWithOpenAI(String(query).trim())
    } catch (error) {
      parsedResult = {
        parsed: parseFallbackQuery(String(query).trim()),
        generatedWith: "fallback"
      }
    }

    const results = applyParsedFilters(rows, parsedResult.parsed)

    return res.json({
      ok: true,
      data: {
        query: String(query).trim(),
        parsed: parsedResult.parsed,
        explanation: buildQueryExplanation(parsedResult.parsed),
        results,
        generatedWith: parsedResult.generatedWith
      },
      error: null
    })
  } catch (err) {
    console.log(err)

    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: "ANALYTICS_QUERY_FAILED",
        message: "Unable to process analytics query"
      }
    })
  }
}

exports.chatAnalyticsAssistant = async (req, res) => {
  try {
    const { message } = req.body || {}

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        ok: false,
        data: null,
        error: {
          code: "INVALID_MESSAGE",
          message: "Message is required"
        }
      })
    }

    const trimmedMessage = String(message).trim()
    const fallbackAnswer = await buildChatFallbackAnswer(trimmedMessage)

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        data: {
          reply: fallbackAnswer,
          generatedWith: "fallback"
        },
        error: null
      })
    }

    const courses = await getCourses()
    const student = await getStudentByQuery(trimmedMessage)
    const studentCourseNames = student ? await getStudentCourseNames(student.student_id) : []
    const studentProfile = student ? await getStudentFullProfile(student.student_id) : null

    const contextPayload = {
      courses,
      student: student ? { ...student, courses: studentCourseNames } : null,
      studentProfile
    }

    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are an LMS admin assistant. Answer only from provided context. If context is missing, clearly state that data is not available."
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(contextPayload)}\nQuestion: ${trimmedMessage}`
          }
        ]
      })

      const reply = completion?.choices?.[0]?.message?.content?.trim() || fallbackAnswer

      return res.json({
        ok: true,
        data: {
          reply,
          generatedWith: completion?.choices?.[0]?.message?.content ? "openai" : "fallback"
        },
        error: null
      })
    } catch (aiError) {
      return res.json({
        ok: true,
        data: {
          reply: fallbackAnswer,
          generatedWith: "fallback"
        },
        error: {
          code: "AI_CHAT_FAILED",
          message: "Fallback response returned"
        }
      })
    }
  } catch (err) {
    console.log(err)

    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: "ANALYTICS_CHAT_FAILED",
        message: "Unable to process assistant message"
      }
    })
  }
}

const getStudentAssistantContext = async (studentId) => {
  if (!studentId) {
    return {
      student: null,
      upcomingPrograms: [],
      upcomingDeadlines: [],
      performance: []
    }
  }

  const [hasStudents, hasEnrollments, hasPrograms, hasAssignments, hasSubmissions, hasAttendance] = await Promise.all([
    tableExists("students"),
    tableExists("enrollments"),
    tableExists("programs"),
    tableExists("assignments"),
    tableExists("submissions"),
    tableExists("attendance")
  ])

  const studentInfoResult = hasStudents
    ? await pool.query("SELECT student_id, name, email, batch FROM students WHERE student_id = $1 LIMIT 1", [studentId])
    : { rows: [] }

  const programsResult = hasEnrollments && hasPrograms
    ? await pool.query(
      `SELECT
        p.program_id,
        p.program_name,
        p.program_incharge,
        MIN(a.deadline) FILTER (WHERE a.deadline >= CURRENT_DATE) AS next_deadline
      FROM enrollments e
      JOIN programs p ON p.program_id = e.program_id
      LEFT JOIN assignments a ON a.program_id = p.program_id
      WHERE e.student_id = $1
      GROUP BY p.program_id, p.program_name, p.program_incharge
      ORDER BY next_deadline NULLS LAST, p.program_name`,
      [studentId]
    )
    : { rows: [] }

  const deadlinesResult = hasAssignments && hasEnrollments && hasPrograms
    ? await pool.query(
      `SELECT
        a.title,
        a.deadline,
        p.program_name,
        COALESCE(sub.status, 'Pending') AS status
      FROM assignments a
      JOIN enrollments e ON e.program_id = a.program_id
      JOIN programs p ON p.program_id = a.program_id
      LEFT JOIN submissions sub
        ON sub.assignment_id = a.assignment_id
        AND sub.student_id = $1
      WHERE e.student_id = $1
        AND COALESCE(sub.status, 'Pending') = 'Pending'
      ORDER BY a.deadline ASC
      LIMIT 12`,
      [studentId]
    )
    : { rows: [] }

  const performanceResult = hasEnrollments && hasPrograms
    ? await pool.query(
      `SELECT
        p.program_name,
        COALESCE(ass.total_assignments, 0) AS total_assignments,
        COALESCE(sub.assignments_completed, 0) AS assignments_completed,
        COALESCE(sub.avg_submission_score, 0) AS avg_submission_score,
        COALESCE(att.attendance_percentage, 0) AS attendance_percentage,
        ROUND(
          (
            COALESCE(
              (sub.assignments_completed::decimal / NULLIF(ass.total_assignments, 0)) * 100,
              0
            ) * 0.6
          )
          +
          (COALESCE(att.attendance_percentage, 0) * 0.4)
        ) AS score
      FROM enrollments e
      JOIN programs p ON e.program_id = p.program_id
      LEFT JOIN (
        SELECT program_id, COUNT(*) AS total_assignments
        FROM assignments
        GROUP BY program_id
      ) ass ON ass.program_id = p.program_id
      LEFT JOIN (
        SELECT
          a.program_id,
          s.student_id,
          COUNT(*) FILTER (WHERE s.status = 'Submitted') AS assignments_completed,
          ROUND(
            AVG(s.score) FILTER (
              WHERE s.status = 'Submitted'
              AND s.score IS NOT NULL
            ),
            2
          ) AS avg_submission_score
        FROM submissions s
        JOIN assignments a ON a.assignment_id = s.assignment_id
        WHERE s.student_id = $1
        GROUP BY a.program_id, s.student_id
      ) sub ON sub.program_id = p.program_id AND sub.student_id = e.student_id
      LEFT JOIN (
        SELECT
          student_id,
          program_id,
          ROUND(
            AVG(
              CASE
                WHEN status = 'Present' THEN 100.0
                ELSE 0
              END
            ),
            2
          ) AS attendance_percentage
        FROM attendance
        GROUP BY student_id, program_id
      ) att ON att.program_id = p.program_id AND att.student_id = e.student_id
      WHERE e.student_id = $1
      ORDER BY p.program_name`,
      [studentId]
    )
    : { rows: [] }

  return {
    student: studentInfoResult.rows[0] || null,
    upcomingPrograms: programsResult.rows,
    upcomingDeadlines: deadlinesResult.rows,
    performance: performanceResult.rows
  }
}

const buildStudentFallbackAnswer = (message, context) => {
  const normalized = String(message || "").toLowerCase()
  const { student, upcomingPrograms, upcomingDeadlines, performance } = context

  if (!student) {
    return "I could not load your student profile right now. Please try again."
  }

  if (normalized.includes("upcoming") && normalized.includes("program")) {
    const withDates = upcomingPrograms.filter((item) => item.next_deadline)
    if (!withDates.length) {
      return "No upcoming program deadlines are currently available."
    }

    const topPrograms = withDates
      .slice(0, 5)
      .map((item) => `${item.program_name} (next deadline: ${new Date(item.next_deadline).toLocaleDateString("en-GB")})`)

    return `Upcoming programs for you: ${topPrograms.join(", ")}.`
  }

  if (normalized.includes("which assignment is due first") || normalized.includes("due first")) {
    const first = upcomingDeadlines[0]
    if (!first) {
      return "You currently have no pending submission deadlines."
    }

    return `Your first due assignment is ${first.title} (${first.program_name}) on ${new Date(first.deadline).toLocaleDateString("en-GB")}.`
  }

  if (normalized.includes("deadline") || normalized.includes("last date") || normalized.includes("submission")) {
    if (!upcomingDeadlines.length) {
      return "You currently have no pending submission deadlines."
    }

    const topDeadlines = upcomingDeadlines
      .slice(0, 6)
      .map((item) => `${item.title} (${item.program_name}) - ${new Date(item.deadline).toLocaleDateString("en-GB")}`)

    return `Your next submission deadlines: ${topDeadlines.join("; ")}.`
  }

  if (normalized.includes("summarize my performance this week")) {
    if (!performance.length) {
      return "No performance data is available this week."
    }

    const top = [...performance].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0]
    const low = [...performance].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0]

    return `This week summary: strongest program is ${top.program_name} (${top.score}%), lowest is ${low.program_name} (${low.score}%). Prioritize improving ${low.program_name} first.`
  }

  if (normalized.includes("program needs more focus") || normalized.includes("low score programs")) {
    if (!performance.length) {
      return "No program performance data is available yet."
    }

    const weakest = [...performance].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0]
    return `${weakest.program_name} needs the most focus now (score ${weakest.score}%).`
  }

  if (normalized.includes("how many assignments are still pending") || normalized.includes("pending assignments")) {
    return `You currently have ${upcomingDeadlines.length} pending assignment deadlines.`
  }

  if (normalized.includes("compare my performance across programs")) {
    if (!performance.length) {
      return "No program performance data is available yet."
    }

    const summary = performance
      .map((row) => `${row.program_name}: ${row.score}%`)
      .join(" | ")

    return `Program comparison: ${summary}.`
  }

  if (normalized.includes("deadlines are this month") || normalized.includes("this month")) {
    const now = new Date()
    const monthDeadlines = upcomingDeadlines.filter((item) => {
      const date = new Date(item.deadline)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })

    if (!monthDeadlines.length) {
      return "You have no pending deadlines in the current month."
    }

    return `Deadlines this month: ${monthDeadlines.map((item) => `${item.title} (${new Date(item.deadline).toLocaleDateString("en-GB")})`).join(", ")}.`
  }

  if (normalized.includes("7-day study plan") || normalized.includes("study plan")) {
    return "7-day plan: Day 1 review weakest program topics, Day 2 solve assignment problems, Day 3 revision + notes, Day 4 submit pending draft, Day 5 mock practice, Day 6 finalize submissions, Day 7 recap and backlog check."
  }

  if (normalized.includes("revision tips") || normalized.includes("prioritize today")) {
    const nextDeadline = upcomingDeadlines[0]
    if (nextDeadline) {
      return `Prioritize today: complete ${nextDeadline.title} first (due ${new Date(nextDeadline.deadline).toLocaleDateString("en-GB")}), then revise 1 weak topic from your lowest-score program.`
    }

    return "Prioritize today: revise weakest program topics for 45 minutes, then practice 20 focused questions and summarize key takeaways."
  }

  if (normalized.includes("performance") || normalized.includes("score") || normalized.includes("progress")) {
    if (!performance.length) {
      return "No program performance data is available yet."
    }

    const bestProgram = [...performance].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0]
    const avgScore = (
      performance.reduce((sum, row) => sum + Number(row.score || 0), 0) /
      performance.length
    ).toFixed(1)

    return `Your average performance score is ${avgScore}%. Best current program: ${bestProgram.program_name} (${bestProgram.score}%).`
  }

  if (normalized.includes("attendance")) {
    if (!performance.length) {
      return "No attendance data is available yet."
    }

    const avgAttendance = (
      performance.reduce((sum, row) => sum + Number(row.attendance_percentage || 0), 0) /
      performance.length
    ).toFixed(1)

    return `Your average attendance across programs is ${avgAttendance}%.`
  }

  return "You can ask me about upcoming programs, due-first assignment, pending deadlines, average score, program comparison, 7-day study plan, and today priorities."
}

exports.chatStudentAssistant = async (req, res) => {
  try {
    const { message } = req.body || {}
    const studentId = req.user?.id

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        ok: false,
        data: null,
        error: {
          code: "INVALID_MESSAGE",
          message: "Message is required"
        }
      })
    }

    let context
    try {
      context = await getStudentAssistantContext(studentId)
    } catch (contextError) {
      context = {
        student: null,
        upcomingPrograms: [],
        upcomingDeadlines: [],
        performance: []
      }
    }

    const fallbackReply = buildStudentFallbackAnswer(String(message).trim(), context)

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        data: {
          reply: fallbackReply,
          generatedWith: "fallback"
        },
        error: null
      })
    }

    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are an LMS student assistant. Use only provided student context. Keep answers concise and practical."
          },
          {
            role: "user",
            content: `Student context: ${JSON.stringify(context)}\nQuestion: ${String(message).trim()}`
          }
        ]
      })

      const reply = completion?.choices?.[0]?.message?.content?.trim() || fallbackReply

      return res.json({
        ok: true,
        data: {
          reply,
          generatedWith: completion?.choices?.[0]?.message?.content ? "openai" : "fallback"
        },
        error: null
      })
    } catch (aiError) {
      return res.json({
        ok: true,
        data: {
          reply: fallbackReply,
          generatedWith: "fallback"
        },
        error: {
          code: "AI_CHAT_FAILED",
          message: "Fallback response returned"
        }
      })
    }
  } catch (err) {
    console.log(err)
    return res.json({
      ok: true,
      data: {
        reply: "I can still help. Ask about upcoming deadlines, attendance improvement tips, or a 7-day study plan.",
        generatedWith: "fallback"
      },
      error: {
        code: "STUDENT_AI_CHAT_FAILED",
        message: "Fallback response returned"
      }
    })
  }
}
