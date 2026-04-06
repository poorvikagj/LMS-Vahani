import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { useParams, useNavigate } from "react-router-dom"
import API from "../../services/api"
import "../admin/grade-assignments.css"

export default function GradeAssignments() {

    const { id } = useParams()
    const navigate = useNavigate()
    const [submissions, setSubmissions] = useState([])
    const [assignmentTitle, setAssignmentTitle] = useState("")
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [score, setScore] = useState("")
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSubmissions()
    }, [id])

    const fetchSubmissions = async () => {
        try {
            setLoading(true)
            const res = await API.get(`/assignments/${id}/submissions`)
            if (res.data.length > 0) {
                setAssignmentTitle(res.data[0].assignment_title || "")
            }
            setSubmissions(res.data)
        } catch (err) {
            console.log("Error fetching submissions:", err)
            toast.error("Failed to load submissions")
        } finally {
            setLoading(false)
        }
    }

    const openSubmissionModal = (submission) => {
        setSelectedSubmission(submission)
        setScore(submission.score || "")
    }

    const closeModal = () => {
        setSelectedSubmission(null)
        setScore("")
    }

    const handleSaveGrade = async () => {
        if (!selectedSubmission) return

        if (!score) {
            toast.warning("Please enter a score")
            return
        }

        const scoreNum = Number(score)
        if (scoreNum < 0 || scoreNum > 100) {
            toast.error("Score must be between 0 and 100")
            return
        }

        try {
            setSaving(true)
            await API.put(`/assignments/grade/${selectedSubmission.submission_id}`, {
                score: scoreNum
            })

            toast.success("Grade saved successfully")
            fetchSubmissions()
            closeModal()
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.error || "Failed to save grade")
        } finally {
            setSaving(false)
        }
    }

    const downloadReport = async () => {
        try {
            if (!id) {
                toast.error("Invalid assignment ID")
                return
            }

            const res = await API.get(`/assignments/${id}/report`, {
                responseType: "blob"
            })

            const blob = new Blob([res.data])
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = url
            // Use assignment title if available, otherwise use ID
            const filename = assignmentTitle
                ? `${assignmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`
                : `assignment_${id}_report.xlsx`
            link.download = filename

            document.body.appendChild(link)
            link.click()
            toast.success("Report downloaded successfully")
            link.remove()

        } catch (err) {
            console.log("Download error:", err)
            toast.error(err.response?.data?.error || "Download failed")
        }
    }

    const downloadSubmissionFile = () => {
        if (!selectedSubmission?.file_url) {
            toast.error("No file to download")
            return
        }
        
        // Extract filename
        const urlParts = selectedSubmission.file_url.split('/')
        const filenameWithExt = urlParts[urlParts.length - 1]
        const fileExtension = filenameWithExt.split('.').pop()
        
        const studentName = selectedSubmission.name.replace(/\s+/g, '_').toLowerCase()
        const assignmentName = (assignmentTitle || 'assignment')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/gi, '')
            .toLowerCase()
        const filename = `${studentName}_${assignmentName}.${fileExtension}`

        // Direct download link
        const link = document.createElement('a')
        link.href = selectedSubmission.file_url
        link.download = filename
        link.click()
    }

    const openSubmissionFileInNewTab = () => {
        if (!selectedSubmission?.file_url) {
            toast.error("No file to open")
            return
        }
        window.open(selectedSubmission.file_url, '_blank')
    }

    if (loading) {
        return (
            <div className="dashboard-content text-center">
                <p>Loading submissions...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-content">

            <div className="grade-header mb-4">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/manage-assignments")}>
                    ← Back
                </button>
                <h2 className="mb-0">Grade Submissions</h2>
                <button className="btn btn-success btn-sm" onClick={downloadReport}>
                    <i className="fa-solid fa-file"></i> &nbsp;Download Report
                </button>
            </div>

            {submissions.length === 0 ? (
                <div className="alert alert-info">No submissions to grade</div>
            ) : (
                <div className="submissions-container">
                    <div className="submissions-list">
                        <h5 className="mb-3">Submissions ({submissions.length})</h5>
                        <div className="submissions-grid">
                            {submissions.map(s => (
                                <div key={s.submission_id} className={`submission-card ${s.score ? 'graded' : 'pending'}`}>
                                    <div className="submission-info">
                                        <p className="student-name">{s.name}</p>
                                        <p className="status-badge">
                                            <span className={`badge bg-${s.status === 'Submitted' ? 'success' : 'secondary'}`}>
                                                {s.status}
                                            </span>
                                        </p>
                                        {s.score !== null && <p className="score-badge">Score: <strong>{s.score}</strong></p>}
                                        {s.submitted_at && <p className="submitted-date">{new Date(s.submitted_at).toLocaleDateString('en-GB')}</p>}
                                    </div>
                                    <button
                                        className="btn btn-outline-primary btn-sm w-100 mt-2"
                                        onClick={() => openSubmissionModal(s)}
                                    >
                                        {s.score ? 'Edit Grade' : 'Grade'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ SUBMISSION DETAIL MODAL */}
            {selectedSubmission && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">

                            <div className="modal-header">
                                <div>
                                    <h5 className="mb-1">{selectedSubmission.name}</h5>
                                    <small className="text-muted">Assignment Grade Form</small>
                                </div>
                                <button
                                    className="btn-close"
                                    onClick={closeModal}
                                    disabled={saving}
                                ></button>
                            </div>

                            <div className="modal-body">

                                {/* ✅ SUBMISSION STATUS */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p className="text-muted mb-1">Status</p>
                                        <span className={`badge bg-${selectedSubmission.status === 'Submitted' ? 'success' : 'secondary'} fs-6`}>
                                            {selectedSubmission.status}
                                        </span>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="text-muted mb-1">Submitted</p>
                                        <p className="mb-0">
                                            {selectedSubmission.submitted_at
                                                ? new Date(selectedSubmission.submitted_at).toLocaleString('en-GB')
                                                : 'Not submitted'}
                                        </p>
                                    </div>
                                </div>

                                <hr />

                                {/* ✅ FILE SECTION */}
                                <div className="mb-3">
                                    <p className="fw-bold mb-2">📎 Assignment File</p>
                                    {selectedSubmission.file_url ? (
                                        <div className="d-grid gap-2">
                                            <button
                                                onClick={openSubmissionFileInNewTab}
                                                className="btn btn-info"
                                            >
                                                <i className="fa-solid fa-arrow-up-right-from-square"></i> &nbsp;Open in New Tab
                                            </button>
                                            <button
                                                onClick={downloadSubmissionFile}
                                                className="btn btn-success"
                                            >
                                                <i className="fa-solid fa-download"></i> &nbsp;Download File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="alert alert-warning mb-0">
                                            ⚠️ No file submitted
                                        </div>
                                    )}
                                </div>

                                <hr />

                                {/* ✅ GRADING FORM */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Score (0-100)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-lg"
                                        value={score}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            // Only allow numbers between 0-100
                                            if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) {
                                                setScore(val)
                                            }
                                        }}
                                        placeholder="Enter score"
                                        min="0"
                                        max="100"
                                        disabled={saving}
                                    />
                                    <small className="text-muted">Enter a score between 0-100</small>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveGrade}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Grade'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}