import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { createSession, getAdminSessions, getAttendanceAnalytics } from "../../services/attendanceSessionService"

const initialForm = {
  title: "",
  program_id: "",
  session_date: "",
  duration_minutes: "60",
  zoom_link: "",
  checkpoint_start_open: "",
  checkpoint_mid_open: "",
  checkpoint_end_open: "",
  checkpoint_window_seconds: 60
}

export default function AttendanceSessions() {
  const [form, setForm] = useState(initialForm)
  const [sessions, setSessions] = useState([])
  const [analytics, setAnalytics] = useState([])

  const load = async () => {
    try {
      const [sessionData, analyticsData] = await Promise.all([
        getAdminSessions(),
        getAttendanceAnalytics()
      ])
      setSessions(sessionData)
      setAnalytics(analyticsData)
    } catch {
      toast.error("Failed to load attendance data")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    try {
      await createSession(form)
      toast.success("Attendance session created")
      setForm(initialForm)
      load()
    } catch {
      toast.error("Failed to create session")
    }
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Smart Attendance Sessions</h2>
        <p className="analytics-subheading mb-0">Create Zoom sessions with start/mid/end checkpoint windows.</p>
      </div>

      <form className="card p-3 mb-4" onSubmit={submit}>
        <div className="row g-2">
          <div className="col-md-3"><input className="form-control" placeholder="Session title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Program ID" value={form.program_id} onChange={(e) => setForm((p) => ({ ...p, program_id: e.target.value }))} /></div>
          <div className="col-md-2"><input type="date" className="form-control" value={form.session_date} onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Duration (min)" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Zoom link" value={form.zoom_link} onChange={(e) => setForm((p) => ({ ...p, zoom_link: e.target.value }))} /></div>
          <div className="col-md-3"><input type="datetime-local" className="form-control" value={form.checkpoint_start_open} onChange={(e) => setForm((p) => ({ ...p, checkpoint_start_open: e.target.value }))} /></div>
          <div className="col-md-3"><input type="datetime-local" className="form-control" value={form.checkpoint_mid_open} onChange={(e) => setForm((p) => ({ ...p, checkpoint_mid_open: e.target.value }))} /></div>
          <div className="col-md-3"><input type="datetime-local" className="form-control" value={form.checkpoint_end_open} onChange={(e) => setForm((p) => ({ ...p, checkpoint_end_open: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Window sec" value={form.checkpoint_window_seconds} onChange={(e) => setForm((p) => ({ ...p, checkpoint_window_seconds: e.target.value }))} /></div>
          <div className="col-md-1"><button className="btn btn-primary w-100">Create</button></div>
        </div>
      </form>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="analytics-chart-card">
            <h5>Sessions</h5>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Program</th>
                    <th>Date</th>
                    <th>Zoom</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan="4" className="text-center">No sessions yet</td></tr>
                  ) : sessions.map((s) => (
                    <tr key={s.session_id}>
                      <td>{s.title}</td>
                      <td>{s.program_id}</td>
                      <td>{new Date(s.session_date).toLocaleDateString("en-GB")}</td>
                      <td>{s.zoom_link ? <a href={s.zoom_link} target="_blank" rel="noreferrer">Join</a> : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="analytics-chart-card">
            <h5>Attendance Categories</h5>
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr><th>Student</th><th>%</th><th>Category</th></tr>
                </thead>
                <tbody>
                  {analytics.length === 0 ? (
                    <tr><td colSpan="3" className="text-center">No analytics yet</td></tr>
                  ) : analytics.map((a) => (
                    <tr key={a.student_id}>
                      <td>{a.name}</td>
                      <td>{a.attendance_percentage}</td>
                      <td>{a.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
