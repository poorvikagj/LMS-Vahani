import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import API from "../../services/api"

export default function Messages() {
  const [inbox, setInbox] = useState([])
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState({ receiver_id: "", receiver_role: "student", message: "" })

  const role = localStorage.getItem("role")
  const defaultReceiverRole = role === "admin" ? "student" : "admin"

  const loadContacts = async () => {
    try {
      const res = await API.get("/messages/contacts")
      const data = Array.isArray(res.data) ? res.data : []
      setContacts(data)

      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          receiver_id: String(data[0].id),
          receiver_role: data[0].role || defaultReceiverRole
        }))
      }
    } catch {
      toast.error("Failed to load contacts")
    }
  }

  const loadInbox = async () => {
    try {
      const res = await API.get("/messages/inbox")
      setInbox(res.data)
    } catch {
      toast.error("Failed to load inbox")
    }
  }

  useEffect(() => {
    setForm((prev) => ({ ...prev, receiver_role: defaultReceiverRole }))
    loadContacts()
    loadInbox()
  }, [defaultReceiverRole])

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
      loadInbox()
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
          <div className="col-md-4">
            {contacts.length === 0 ? (
              <div className="form-control bg-light text-muted d-flex align-items-center" style={{ minHeight: 38 }}>
                View mode only
              </div>
            ) : (
              <select
                className="form-select"
                value={form.receiver_id}
                onChange={(e) => {
                  const selected = contacts.find((item) => String(item.id) === e.target.value)
                  setForm((prev) => ({
                    ...prev,
                    receiver_id: e.target.value,
                    receiver_role: selected?.role || defaultReceiverRole
                  }))
                }}
              >
                {contacts.map((contact) => (
                  <option key={`${contact.role}-${contact.id}`} value={contact.id}>
                    {contact.name} ({contact.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={defaultReceiverRole}
              disabled
            >
              <option value={defaultReceiverRole}>{defaultReceiverRole}</option>
            </select>
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Write a message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100" disabled={contacts.length === 0}>Send</button>
          </div>
        </div>
        {contacts.length === 0 ? (
          <p className="text-muted small mb-0 mt-2">You can still view your messages below.</p>
        ) : null}
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
                  <td>{item.sender_role} #{item.sender_id}</td>
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
