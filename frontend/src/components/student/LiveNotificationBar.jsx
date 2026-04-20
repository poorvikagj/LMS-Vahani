import { useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import { getStudentNotifications } from "../../services/notificationService"

export default function LiveNotificationBar() {
  const [notifications, setNotifications] = useState([])
  const [activeToast, setActiveToast] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadHistory = async () => {
      try {
        const data = await getStudentNotifications()
        if (mounted) {
          setNotifications(Array.isArray(data) ? data : [])
        }
      } catch {
        // silent fallback
      }
    }

    loadHistory()

    const socket = io(import.meta.env.VITE_API_URL, {
      query: { role: "student" },
      transports: ["websocket", "polling"]
    })

    socket.on("notification:new", (payload) => {
      setNotifications((prev) => [payload, ...prev])
      setActiveToast(payload)

      setTimeout(() => {
        setActiveToast((current) => (current?.notification_id === payload.notification_id ? null : current))
      }, 7000)
    })

    return () => {
      mounted = false
      socket.disconnect()
    }
  }, [])

  const latest = useMemo(() => notifications.slice(0, 8), [notifications])

  return (
    <>
      {activeToast ? (
        <div
          style={{
            position: "fixed",
            top: "76px",
            right: "20px",
            zIndex: 1200,
            background: activeToast.priority === "important" ? "#7f1d1d" : "#1d4ed8",
            color: "#fff",
            borderRadius: "12px",
            padding: "12px 14px",
            boxShadow: "0 12px 28px rgba(15,23,42,0.35)",
            width: "min(420px, calc(100vw - 32px))"
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <strong>{activeToast.title}</strong>
              <div style={{ fontSize: "0.9rem", opacity: 0.95 }}>{activeToast.message}</div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setActiveToast(null)}
            >
              x
            </button>
          </div>
        </div>
      ) : null}

      <div className="analytics-chart-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Live Notifications</h5>
          <span className="badge text-bg-secondary">{latest.length}</span>
        </div>
        {latest.length === 0 ? (
          <p className="analytics-empty-note mb-0">No notifications yet.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {latest.map((item) => (
              <div
                key={item.notification_id}
                className="p-2 rounded"
                style={{
                  background: item.priority === "important" ? "#fee2e2" : "#e0f2fe",
                  border: "1px solid #cbd5e1"
                }}
              >
                <strong>{item.title}</strong>
                <div>{item.message}</div>
                <small className="text-muted">{new Date(item.created_at).toLocaleString("en-GB")}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
