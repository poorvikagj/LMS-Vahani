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

  const studentKeywordMatch = text.match(/student\s+([a-zA-Z\s]+)/i)
  const possibleName = studentKeywordMatch?.[1]?.trim() || text

  const result = await pool.query(
    "SELECT student_id, name, email, batch FROM students WHERE name ILIKE $1 ORDER BY student_id DESC LIMIT 1",
    [`%${possibleName}%`]
  )

  return result.rows[0] || null
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

  if (normalized.includes("student") || normalized.includes("details") || normalized.includes("detail")) {
    const student = await getStudentByQuery(query)

    if (!student) {
      return "I could not find that student. Try the exact name or email."
    }

    const courseNames = await getStudentCourseNames(student.student_id)
    const courseText = courseNames.length ? courseNames.join(", ") : "No course enrollments yet"

    return `Student details: Name: ${student.name}, Email: ${student.email}, Batch: ${student.batch || "N/A"}, Courses: ${courseText}.`
  }

  return "Ask me things like: 'Show all courses created by admin' or 'Give details of student Riya'."
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

    const contextPayload = {
      courses,
      student: student ? { ...student, courses: studentCourseNames } : null
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
