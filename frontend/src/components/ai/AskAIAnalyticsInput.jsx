import { useState } from "react"
import { askAnalyticsAI } from "../../services/adminService"

export default function AskAIAnalyticsInput({ onApply, onReset }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const handleAsk = async (event) => {
    event.preventDefault()

    if (!query.trim()) {
      return
    }

    try {
      setLoading(true)
      const res = await askAnalyticsAI(query.trim())

      if (res?.ok) {
        const resultCount = res?.data?.results?.length || 0
        const explanation = res?.data?.explanation || "Query applied"
        setStatus(`${explanation} (${resultCount} result${resultCount === 1 ? "" : "s"})`)
        onApply?.(res.data)
      } else {
        setStatus("Unable to process query right now")
      }
    } catch (error) {
      setStatus("Unable to process query right now")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery("")
    setStatus("")
    onReset?.()
  }

  return (
    <div className="card p-3 shadow-sm analytics-ai-card h-100 mb-0">
      <form className="d-flex gap-2 align-items-center analytics-ai-form" onSubmit={handleAsk}>
        <input
          className="form-control analytics-ai-input"
          placeholder='Ask AI (e.g., "Show attendance for batch 2023")'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn btn-primary analytics-ai-btn" type="submit" disabled={loading}>
          {loading ? "Asking..." : "Ask AI"}
        </button>
        <button className="btn btn-outline-secondary analytics-ai-btn analytics-ai-clear-btn" type="button" onClick={handleClear} disabled={loading}>
          Clear
        </button>
      </form>
      {status ? <small className="text-muted d-block mt-2 analytics-ai-status">{status}</small> : null}
    </div>
  )
}
