import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { getStudentSessions, markCheckpoint } from "../../services/attendanceSessionService"

export default function LiveAttendance() {
  const [sessions, setSessions] = useState([])

  const load = async () => {
    try {
      const data = await getStudentSessions()
      setSessions(data)
    } catch {
      toast.error("Failed to load live sessions")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onMark = async (sessionId, checkpoint) => {
    try {
      await markCheckpoint(sessionId, checkpoint)
      toast.success(`${checkpoint.toUpperCase()} attendance marked`)
    } catch (error) {
      toast.error(error.response?.data?.error || "Could not mark attendance")
    }
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Live Session Attendance Tracking</h2>
        <p className="analytics-subheading mb-0">Join the scheduled online class and record Start, Mid, and End checkpoints within the approved attendance windows.</p>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Zoom</th>
              <th>Start</th>
              <th>Mid</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No sessions available</td></tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.session_id}>
                  <td>{s.title}</td>
                  <td>{new Date(s.session_date).toLocaleDateString("en-GB")}</td>
                  <td>{s.zoom_link ? <a href={s.zoom_link} target="_blank" rel="noreferrer">Join Class</a> : "-"}</td>
                  <td><button className="btn btn-sm btn-primary" onClick={() => onMark(s.session_id, "start")}>Mark</button></td>
                  <td><button className="btn btn-sm btn-warning" onClick={() => onMark(s.session_id, "mid")}>Mark</button></td>
                  <td><button className="btn btn-sm btn-success" onClick={() => onMark(s.session_id, "end")}>Mark</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
