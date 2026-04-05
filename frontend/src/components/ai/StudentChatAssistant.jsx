import { useState } from "react"
import { chatStudentAI } from "../../services/studentService"

const STUDENT_PROMPTS = [
  "What are my upcoming programs?",
  "Show my next submission deadlines",
  "Which assignment is due first?",
  "Summarize my performance this week",
  "How can I improve my attendance?",
  "Which program needs more focus from me?",
  "Show pending assignments by deadline",
  "Give me a 7-day study plan",
  "How many assignments are still pending?",
  "What is my average score right now?",
  "Compare my performance across programs",
  "How can I improve low score programs?",
  "Which deadlines are this month?",
  "Give quick revision tips for upcoming submissions",
  "What should I prioritize today?"
]

export default function StudentChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I can help with your upcoming programs, submission deadlines, and performance strategy. Pick a prompt or ask your own question."
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
      const res = await chatStudentAI(text)
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
            <h6 className="mb-0">Student Assistant</h6>
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
                  {STUDENT_PROMPTS.map((question) => (
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
              placeholder="Ask: what is my next deadline?"
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
