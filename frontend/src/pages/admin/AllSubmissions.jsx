import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import API from "../../services/api"

export default function AllSubmissions() {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [edited, setEdited] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchAllSubmissions()
    }, [])

    const fetchAllSubmissions = async () => {
        try {
            setLoading(true)
            const res = await API.get("/assignments/submissions/all")
            setSubmissions(res.data || [])
            setEdited({})
        } catch (err) {
            console.log(err)
            toast.error("Failed to load submissions")
        } finally {
            setLoading(false)
        }
    }

    const handleScoreChange = (submissionId, value) => {
        setSubmissions((prev) => prev.map((item) => (
            item.submission_id === submissionId
                ? { ...item, score: value === "" ? null : Number(value) }
                : item
        )))

        setEdited((prev) => ({
            ...prev,
            [submissionId]: true
        }))
    }

    const handleSaveChanges = async () => {
        const updates = submissions
            .filter((item) => edited[item.submission_id])
            .map((item) => ({
                submission_id: item.submission_id,
                score: item.score
            }))

        if (updates.length === 0) {
            toast.info("No score changes to save")
            return
        }

        try {
            setSaving(true)
            await API.put("/assignments/grade-all", { updates })
            toast.success("Scores updated successfully")
            fetchAllSubmissions()
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.error || "Failed to save score changes")
        } finally {
            setSaving(false)
        }
    }

    const getFileNameFromUrl = (url) => {
        if (!url) return "No file"
        try {
            const cleanPath = url.split("?")[0]
            return decodeURIComponent(cleanPath.substring(cleanPath.lastIndexOf("/") + 1))
        } catch {
            return "Uploaded file"
        }
    }

    const filteredSubmissions = useMemo(() => {
        const normalized = search.trim().toLowerCase()
        if (!normalized) return submissions

        return submissions.filter((item) => {
            return (
                String(item.student_name || "").toLowerCase().includes(normalized)
                || String(item.assignment_title || "").toLowerCase().includes(normalized)
                || String(item.program_name || "").toLowerCase().includes(normalized)
            )
        })
    }, [submissions, search])

    return (
        <div className="dashboard-content">
            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">All Assignment Submissions</h2>
                <p className="analytics-subheading mb-0">Central view of every student submission with file access.</p>
            </div>

            <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
                <input
                    className="form-control"
                    style={{ maxWidth: "360px" }}
                    placeholder="Search by student, assignment, or program"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="d-flex align-items-center gap-2">
                    <span className="badge text-bg-primary">Total: {filteredSubmissions.length}</span>
                    <button
                        className="btn btn-success btn-sm"
                        disabled={saving || Object.keys(edited).length === 0}
                        onClick={handleSaveChanges}
                    >
                        {saving ? "Saving..." : "Save Score Changes"}
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>Student</th>
                            <th>Assignment</th>
                            <th>Program</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>File Name</th>
                            <th>Uploaded At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center">Loading submissions...</td>
                            </tr>
                        ) : filteredSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center">No submissions found. Ask students to submit at least one assignment file first.</td>
                            </tr>
                        ) : (
                            filteredSubmissions.map((item) => (
                                <tr key={item.submission_id}>
                                    <td>{item.student_name}</td>
                                    <td>{item.assignment_title}</td>
                                    <td>{item.program_name}</td>
                                    <td>{item.status}</td>
                                    <td style={{ minWidth: "110px" }}>
                                        <input
                                            type="number"
                                            className={`form-control form-control-sm ${edited[item.submission_id] ? "bg-warning-subtle border-warning" : ""}`}
                                            value={item.score ?? ""}
                                            onChange={(e) => handleScoreChange(item.submission_id, e.target.value)}
                                        />
                                    </td>
                                    <td>{getFileNameFromUrl(item.file_url)}</td>
                                    <td>
                                        {item.submitted_at
                                            ? new Date(item.submitted_at).toLocaleString("en-GB")
                                            : "-"}
                                    </td>
                                    <td>
                                        {item.file_url ? (
                                            <div className="d-flex gap-2">
                                                <a
                                                    href={item.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    View
                                                </a>
                                                <a
                                                    href={item.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    download
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-muted">No file</span>
                                        )}
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
