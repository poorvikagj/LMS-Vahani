import { useState } from "react"
import { chatAnalyticsAI } from "../../services/adminService"

const STARTER_QUESTIONS = [
  "Show all admin-created programs",
  "How many students are in the LMS?",
  "Which program has the highest attendance?",
  "Which program has the lowest attendance?",
  "Which program has the highest submission score?",
  "Give details of student Enroll Test",
  "Show students in batch 2024",
  "What is the average attendance across programs?",
  "What is the average score across programs?",
  "Which programs need attention right now?",
  "Show attendance status for Official Test Program",
  "Which students have no enrollments?",
  "How many active programs are there?",
  "Show performance summary for all programs",
  "Which program has most students?",
  "What are the top 3 programs by score?",
  "How can we improve low attendance?",
  "Give weekly monitoring checklist for admin",
  "Which students should be flagged for intervention?",
  "Create a report summary for management"
]

export default function AnalyticsChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I can help with student, program, attendance, and performance analytics. Use the quick prompts below or type your own question."
    }
  ])

  const sendQuestion = async (text) => {
    if (!text || loading) {
      return
    }

    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setShowPrompts(false)
    setLoading(true)

    try {
      const res = await chatAnalyticsAI(text)
      const reply = res?.data?.reply || "I could not find that information right now."
      setMessages((prev) => [...prev, { role: "assistant", text: reply }])
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Assistant is unavailable right now. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    await sendQuestion(input.trim())
  }

  return (
    <>
      <button className="analytics-chat-toggle" type="button" onClick={() => setOpen((prev) => !prev)}>
        <i className="fa-solid fa-robot"></i>
        <span>AI Chat</span>
      </button>

      {open ? (
        <div className="analytics-chat-panel">
          <div className="analytics-chat-header">
            <h6 className="mb-0">Analytics Assistant</h6>
            <button className="btn btn-sm" type="button" onClick={() => setOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="analytics-chat-body">
            {showPrompts ? (
              <div className="analytics-chat-prompts">
                <div className="analytics-chat-prompts-head">
                  <span>Suggested questions</span>
                  <button type="button" className="btn btn-sm" onClick={() => setShowPrompts(false)}>Hide</button>
                </div>
                <div className="analytics-chat-prompt-grid">
                  {STARTER_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      className="analytics-chat-prompt-chip"
                      onClick={() => sendQuestion(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="analytics-chat-prompts-toggle-wrap">
                <button type="button" className="analytics-chat-show-prompts" onClick={() => setShowPrompts(true)}>
                  Show suggested questions
                </button>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`analytics-chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <form className="analytics-chat-form" onSubmit={sendMessage}>
            <input
              className="form-control"
              placeholder="Ask: details of student Riya"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}
