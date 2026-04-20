import { useEffect, useState } from "react"
import API from "../../services/api"
import "../../public/css/dashboard.css"
import "../../public/css/analytics-dashboard.css"
import { toast } from "react-toastify"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function Assignments() {

    const [assignments, setAssignments] = useState([])
    const [files, setFiles] = useState({})
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [selectedProgram, setSelectedProgram] = useState("all")
    const [previewFile, setPreviewFile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState({})
    const [uploadProgress, setUploadProgress] = useState({})

    const getFileNameFromUrl = (url) => {
        if (!url) return ""
        try {
            const cleanPath = url.split("?")[0]
            return decodeURIComponent(cleanPath.substring(cleanPath.lastIndexOf("/") + 1))
        } catch {
            return "Uploaded file"
        }
    }

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            setLoading(true)
            const res = await API.get("/assignments")
            setAssignments(res.data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load assignments")
        } finally {
            setLoading(false)
        }
    }

    // File select
    const handleFileChange = (e, id) => {
        setFiles({ ...files, [id]: e.target.files[0] })
    }

    // Submit
    const handleSubmit = async (id) => {

        if (!files[id]) {
            toast.warn("Select a file first")
            return
        }

        const formData = new FormData()
        formData.append("assignment_id", id)
        formData.append("file", files[id])

        try {
            setUploading(prev => ({ ...prev, [id]: true }))
            setUploadProgress(prev => ({ ...prev, [id]: 0 }))

            const config = {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    // Use functional state update for real-time progress
                    setUploadProgress(prev => ({ ...prev, [id]: percentCompleted }))
                }
            }

            await API.post("/assignments/submit", formData, config)
            toast.success("Submitted successfully")
            setFiles(prev => ({ ...prev, [id]: null }))
            fetchAssignments()
        } catch (err) {
            toast.error(err.response?.data?.error || "Submission failed")
        } finally {
            setUploading(prev => ({ ...prev, [id]: false }))
            setUploadProgress(prev => ({ ...prev, [id]: 0 }))
        }
    }

    // Unique programs
    const programs = [...new Set(assignments.map(a => a.program_name))]

    // Filter logic
    const filteredAssignments = assignments.filter(a => {

        if (filter === "pending" && a.status !== "Pending") return false
        if (filter === "completed" && a.status !== "Submitted") return false

        if (selectedProgram !== "all" && a.program_name !== selectedProgram)
            return false

        if (!a.title.toLowerCase().includes(search.toLowerCase()))
            return false

        return true
    })

    return (
        <div className="dashboard-content">

            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">Assignments</h2>
                <p className="analytics-subheading mb-0">Track deadlines, submit files, and monitor grading status for each assignment.</p>
            </div>

            {/* 🔹 TOP BAR */}
            <div className="assignment-topbar">

                {/* Tabs */}
                <div className="tabs">
                    {["all", "pending", "completed"].map(tab => (
                        <button
                            key={tab}
                            className={filter === tab ? "tab active" : "tab"}
                            onClick={() => setFilter(tab)}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <input
                    className="search-input"
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            {/* 🔹 PROGRAM FILTER */}
            <div className="program-filters">

                <span
                    className={selectedProgram === "all" ? "chip active" : "chip"}
                    onClick={() => setSelectedProgram("all")}
                >
                    All
                </span>

                {programs.map((p, i) => (
                    <span
                        key={i}
                        className={selectedProgram === p ? "chip active" : "chip"}
                        onClick={() => setSelectedProgram(p)}
                    >
                        {p}
                    </span>
                ))}

            </div>

            {/* 🔹 ASSIGNMENTS GRID */}
            {loading ? (
                <div className="assignment-grid">
                    {[...Array(6)].map((_, i) => (
                        <div className="assignment-card skeleton" key={i}>
                            <div className="skeleton-title"></div>
                            <div className="skeleton-text"></div>
                            <div className="skeleton-text"></div>
                            <div className="skeleton-text small"></div>
                        </div>
                    ))}
                </div>

            ) :  filteredAssignments.length === 0 ? (
                <div className="empty-state">
                    <p>No assignments found</p>
                </div>
            ) : (

                <div className="assignment-grid">

                    {filteredAssignments.map(a => {

                        const isLate = new Date(a.deadline) < new Date()

                        return (
                            <div className="assignment-card" key={a.assignment_id}>

                                {/* Header */}
                                <div className="card-header">
                                    <h5>{a.title}</h5>
                                    <span className={`badge ${a.status === "Submitted" ? "success" : "pending"}`}>
                                        {a.status}
                                    </span>
                                </div>

                                {/* Program */}
                                <p className="program">{a.program_name}</p>

                                {/* Description */}
                                <p className="desc">
                                    {a.description || "No description"}
                                </p>
                                <hr style={{ opacity: 0.2 }} />
                                {/* Deadline */}
                                <p className={`deadline ${isLate ? "late" : ""}`}>
                                    Deadline: {new Date(a.deadline).toLocaleDateString("en-GB")}
                                </p>

                                {/* Upload */}
                                {a.status === "Pending" && (
                                    <>
                                        <input
                                            type="file"
                                            className="form-control mb-2"
                                            onChange={(e) => handleFileChange(e, a.assignment_id)}
                                            disabled={uploading[a.assignment_id]}
                                        />

                                        {files[a.assignment_id] && (
                                            <p className="file-name" style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
                                                📎 {files[a.assignment_id].name}
                                            </p>
                                        )}

                                        {uploading[a.assignment_id] && (
                                            <div style={{ marginBottom: "0.75rem" }}>
                                                <div style={{ 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    gap: "0.5rem",
                                                    marginBottom: "0.5rem"
                                                }}>
                                                    <div style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        border: "3px solid #f3f3f3",
                                                        borderTop: "3px solid #007bff",
                                                        borderRadius: "50%",
                                                        animation: "spin 1s linear infinite"
                                                    }}></div>
                                                    <span style={{ fontSize: "0.85rem", color: "#007bff" }}>
                                                        Uploading... {uploadProgress[a.assignment_id]}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    width: "100%",
                                                    height: "6px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "3px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        height: "100%",
                                                        width: `${uploadProgress[a.assignment_id]}%`,
                                                        backgroundColor: "#007bff",
                                                        transition: "width 0.3s ease"
                                                    }}></div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            className="btn btn-success w-100"
                                            onClick={() => handleSubmit(a.assignment_id)}
                                            disabled={uploading[a.assignment_id]}
                                            style={{
                                                opacity: uploading[a.assignment_id] ? 0.6 : 1,
                                                cursor: uploading[a.assignment_id] ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            {uploading[a.assignment_id] ? "Uploading..." : "Submit"}
                                        </button>
                                    </>
                                )}

                                {/* Score */}
                                {a.score !== null && (
                                    <p className="score">Score: {a.score}</p>
                                )}

                                {a.file_url && (
                                    <p className="mb-1" style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                                        File: {getFileNameFromUrl(a.file_url)}
                                    </p>
                                )}

                                {a.submitted_at && (
                                    <p className="mb-2" style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                                        Uploaded: {new Date(a.submitted_at).toLocaleString("en-GB")}
                                    </p>
                                )}

                                {/* File Actions */}
                                {a.file_url && (
                                    <div className="file-actions">

                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setPreviewFile(a.file_url)}
                                        >
                                            Preview
                                        </button>

                                        <a
                                            href={a.file_url}
                                            download
                                            className="btn btn-sm btn-secondary"
                                        >
                                            Download
                                        </a>

                                    </div>
                                )}

                            </div>
                        )
                    })}

                </div>

            )}

            {/* 🔹 PREVIEW MODAL */}
            {previewFile && (
                <div className="preview-overlay" onClick={() => setPreviewFile(null)}>

                    <div className="preview-box" onClick={(e) => e.stopPropagation()}>

                        {previewFile.endsWith(".pdf") ? (
                            <iframe src={previewFile} title="Preview"></iframe>
                        ) : (
                            <img src={previewFile} alt="Preview" />
                        )}

                        <button
                            className="btn btn-danger mt-2"
                            onClick={() => setPreviewFile(null)}
                        >
                            Close
                        </button>

                    </div>

                </div>
            )}

            <StudentChatAssistant />

        </div>
    )
}