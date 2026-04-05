import { useEffect, useState } from "react"
import { getAnalyticsSummary } from "../../services/adminService"

export default function AnalyticsSummaryCard() {
  const [summary, setSummary] = useState("")
  const [source, setSource] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await getAnalyticsSummary()

      if (res?.ok) {
        setSummary(res?.data?.summary || "No summary available.")
        setSource(res?.data?.generatedWith || "fallback")
      } else {
        setSummary("Unable to generate summary right now.")
        setSource("fallback")
      }
    } catch (error) {
      setSummary("Unable to generate summary right now.")
      setSource("fallback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-3 shadow-sm analytics-ai-card h-100 mb-0">
      <div className="d-flex justify-content-between align-items-center mb-2 analytics-ai-card-header">
        <h5 className="mb-0 analytics-ai-title">AI Summary</h5>
        <span className="badge text-bg-light border text-uppercase analytics-ai-source">{source || "loading"}</span>
      </div>

      {loading ? (
        <p className="text-muted mb-0 analytics-ai-summary-text">Generating summary...</p>
      ) : (
        <p className="mb-0 analytics-ai-summary-text">{summary}</p>
      )}
    </div>
  )
}
