import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import API from "../../services/api"

export default function Messages() {
  const [inbox, setInbox] = useState([])
  const [form, setForm] = useState({ receiver_id: "", receiver_role: "student", message: "" })

  const role = localStorage.getItem("role")

  const loadInbox = async () => {
    try {
      const res = await API.get("/messages/inbox")
      setInbox(res.data)
    } catch {
      toast.error("Failed to load inbox")
    }
  }

  useEffect(() => {
    loadInbox()
  }, [])

  const sendMessage = async (event) => {
    event.preventDefault()

    if (!form.receiver_id || !form.message) {
      toast.warn("Receiver and message are required")
      return
    }

    try {
      await API.post("/messages/send", {
        receiver_id: Number(form.receiver_id),
        receiver_role: form.receiver_role,
        message: form.message
      })
      toast.success("Message sent")
      setForm((prev) => ({ ...prev, message: "" }))
    } catch {
      toast.error("Failed to send message")
    }
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Messages</h2>
        <p className="analytics-subheading mb-0">Basic admin-student messaging.</p>
      </div>

      <form className="card p-3 mb-4" onSubmit={sendMessage}>
        <div className="row g-2">
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Receiver ID"
              value={form.receiver_id}
              onChange={(e) => setForm((prev) => ({ ...prev, receiver_id: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={form.receiver_role}
              onChange={(e) => setForm((prev) => ({ ...prev, receiver_role: e.target.value }))}
            >
              <option value={role === "admin" ? "student" : "admin"}>{role === "admin" ? "student" : "admin"}</option>
            </select>
          </div>
          <div className="col-md-7">
            <input
              className="form-control"
              placeholder="Write a message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100">Send</button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>From</th>
              <th>Role</th>
              <th>Message</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {inbox.length === 0 ? (
              <tr><td colSpan="4" className="text-center">No messages</td></tr>
            ) : (
              inbox.map((item) => (
                <tr key={item.message_id}>
                  <td>{item.sender_id}</td>
                  <td>{item.sender_role}</td>
                  <td>{item.message}</td>
                  <td>{new Date(item.created_at).toLocaleString("en-GB")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
