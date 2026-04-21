import { useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import { getStudentNotifications } from "../../services/notificationService"
import "./live-notification-bar.css"

const PRIORITY_LABEL = {
  important: "Important",
  normal: "General"
}

const getPriority = (value) => (String(value || "").toLowerCase() === "important" ? "important" : "normal")

const formatDateTime = (value) => {
  if (!value) return "Just now"
  return new Date(value).toLocaleString("en-GB")
}

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
  const unreadImportantCount = useMemo(
    () => latest.filter((item) => getPriority(item.priority) === "important").length,
    [latest]
  )

  return (
    <>
      {activeToast ? (
        <div
          className={`live-notification-toast ${getPriority(activeToast.priority) === "important" ? "is-important" : ""}`}
          role="status"
          aria-live="polite"
        >
          <div className="live-notification-toast-header">
            <div className="live-notification-toast-title-wrap">
              <span className="live-notification-toast-chip">{PRIORITY_LABEL[getPriority(activeToast.priority)]}</span>
              <strong>{activeToast.title || "New Notification"}</strong>
            </div>
            <button
              type="button"
              className="live-notification-close-btn"
              onClick={() => setActiveToast(null)}
              aria-label="Close notification"
            >
              x
            </button>
          </div>
          <p className="live-notification-toast-message">{activeToast.message}</p>
          <small className="live-notification-toast-time">{formatDateTime(activeToast.created_at)}</small>
        </div>
      ) : null}

      <div className="analytics-chart-card mb-4 live-notification-card">
        <div className="live-notification-head">
          <div>
            <h5 className="mb-1">Live Notifications</h5>
            <p className="live-notification-subtitle mb-0">Instant updates from your admin team.</p>
          </div>

          <div className="live-notification-metrics">
            <div className="live-notification-metric-pill">
              <span className="label">Total</span>
              <strong>{latest.length}</strong>
            </div>
            <div className="live-notification-metric-pill is-alert">
              <span className="label">Important</span>
              <strong>{unreadImportantCount}</strong>
            </div>
          </div>
        </div>

        <div className="live-notification-hero-graphic" aria-hidden="true">
          <div className="graphic-pulse-ring"></div>
          <div className="graphic-core">
            <span>!</span>
          </div>
          <div className="graphic-caption">Live Signal</div>
        </div>

        {latest.length === 0 ? (
          <div className="live-notification-empty-state">
            <div className="empty-icon" aria-hidden="true">O</div>
            <div>
              <strong>No notifications yet</strong>
              <p className="mb-0">You will see announcements and class alerts here.</p>
            </div>
          </div>
        ) : (
          <div className="live-notification-list">
            {latest.map((item) => (
              <div
                key={item.notification_id}
                className={`live-notification-item ${getPriority(item.priority) === "important" ? "is-important" : ""}`}
              >
                <div className="live-notification-item-top">
                  <strong>{item.title}</strong>
                  <span className="live-notification-priority-badge">{PRIORITY_LABEL[getPriority(item.priority)]}</span>
                </div>
                <p className="live-notification-item-message">{item.message}</p>
                <small>{formatDateTime(item.created_at)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
