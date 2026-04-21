import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import {
  createNotification,
  deleteNotification,
  getAdminNotifications,
  updateNotification
} from "../../services/notificationService"

const initialForm = {
  title: "",
  message: "",
  show_on_homepage: false,
  banner_image_url: "",
  banner_order: 0
}

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
    setForm({
      title: item.title,
      message: item.message,
      show_on_homepage: Boolean(item.show_on_homepage),
      banner_image_url: item.banner_image_url || "",
      banner_order: Number.isFinite(Number(item.banner_order)) ? Number(item.banner_order) : 0
    })
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
        <p className="analytics-subheading mb-0">Create real-time announcements and publish selected items to the homepage banner.</p>
        <div className="mt-2">
          <Link to="/messages" className="btn btn-sm btn-outline-primary">Open Messages</Link>
        </div>
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
              placeholder="Message / Subtitle"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100">{editingId ? "Save" : "Send"}</button>
          </div>

          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Banner image URL (optional)"
              value={form.banner_image_url || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, banner_image_url: e.target.value }))}
            />
          </div>

          <div className="col-md-2">
            <input
              className="form-control"
              type="number"
              placeholder="Banner order"
              value={form.banner_order ?? 0}
              onChange={(e) => setForm((prev) => ({ ...prev, banner_order: Number(e.target.value) || 0 }))}
            />
          </div>

          <div className="col-md-2 d-flex align-items-center">
            <label className="form-check-label d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={Boolean(form.show_on_homepage)}
                onChange={(e) => setForm((prev) => ({ ...prev, show_on_homepage: e.target.checked }))}
              />
              Show on homepage banner
            </label>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Homepage Banner</th>
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
                    {item.show_on_homepage ? (
                      <div>
                        <span className="badge text-bg-success">Published</span>
                        <div className="small text-muted">Order: {item.banner_order ?? 0}</div>
                      </div>
                    ) : (
                      <span className="badge text-bg-secondary">No</span>
                    )}
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
