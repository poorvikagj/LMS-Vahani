import API from "./api"

export const getAdminSessions = async () => {
  const res = await API.get("/attendance-sessions/admin")
  return res.data
}

export const getAttendancePrograms = async () => {
  const res = await API.get("/attendance-sessions/programs/admin")
  return res.data
}

export const getStudentSessions = async () => {
  const res = await API.get("/attendance-sessions/student")
  return res.data
}

export const createSession = async (payload) => {
  const res = await API.post("/attendance-sessions/admin", payload)
  return res.data
}

export const markCheckpoint = async (sessionId, checkpoint_type) => {
  const res = await API.post(`/attendance-sessions/${sessionId}/mark`, { checkpoint_type })
  return res.data
}

export const getAttendanceAnalytics = async () => {
  const res = await API.get("/attendance-sessions/analytics/admin")
  return res.data
}
