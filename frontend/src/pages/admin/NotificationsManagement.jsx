import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
  createNotification,
  deleteNotification,
  getAdminNotifications,
  updateNotification
} from "../../services/notificationService"

const initialForm = { title: "", message: "", priority: "normal" }

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      const data = await getAdminNotifications()
      setNotifications(data)
    } catch {
      toast.error("Failed to load notifications")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()

    if (!form.title || !form.message) {
      toast.warn("Title and message are required")
      return
    }

    try {
      if (editingId) {
        await updateNotification(editingId, form)
        toast.success("Notification updated")
      } else {
        await createNotification(form)
        toast.success("Notification sent")
      }
      setForm(initialForm)
      setEditingId(null)
      load()
    } catch {
      toast.error("Failed to save notification")
    }
  }

  const onEdit = (item) => {
    setEditingId(item.notification_id)
    setForm({ title: item.title, message: item.message, priority: item.priority })
  }

  const onDelete = async (id) => {
    try {
      await deleteNotification(id)
      toast.success("Notification deleted")
      load()
    } catch {
      toast.error("Delete failed")
    }
  }

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Notification Center</h2>
        <p className="analytics-subheading mb-0">Create real-time announcements for all students.</p>
      </div>

      <form className="card p-3 mb-4" onSubmit={submit}>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
            </select>
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100">{editingId ? "Save" : "Send"}</button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Priority</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No notifications</td>
              </tr>
            ) : (
              notifications.map((item) => (
                <tr key={item.notification_id}>
                  <td>{item.title}</td>
                  <td>{item.message}</td>
                  <td>
                    <span className={`badge ${item.priority === "important" ? "text-bg-danger" : "text-bg-info"}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>{new Date(item.created_at).toLocaleString("en-GB")}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-2" onClick={() => onEdit(item)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.notification_id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
