import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { useParams } from "react-router-dom"
import API from "../../services/api"

export default function GradeAssignments() {

    const { id } = useParams()
    const [submissions, setSubmissions] = useState([])
    const [edited, setEdited] = useState({})
    useEffect(() => {
        fetchSubmissions()
    }, [])

    const fetchSubmissions = async () => {
        try {
            const res = await API.get(`/assignments/${id}/submissions`)
            setSubmissions(res.data)
        } catch (err) {
            console.log("Error fetching submissions:", err)
            toast.error("Failed to load submissions")
        }
    }

    const handleChange = (submission_id, value) => {

    setSubmissions(prev =>
        prev.map(s =>
            s.submission_id === submission_id
                ? { ...s, score: value }
                : s
        )
    )

    // ✅ mark as edited
    setEdited(prev => ({
        ...prev,
        [submission_id]: true
    }))
}

    const handleSaveAll = async () => {
        try {

            const updates = submissions.map(s => ({
                submission_id: s.submission_id,
                score: s.score
            }))

            await API.put("/assignments/grade-all", { updates })

           toast.success("All grades updated successfully")

            setEdited({})   // ✅ reset highlights
            fetchSubmissions()

        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.error || "Bulk update failed")
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
        link.download = `assignment_${id}_report.xlsx`

        document.body.appendChild(link)
        link.click()
        toast.success("Report downloaded successfully")
        link.remove()

    } catch (err) {
        console.log("Download error:", err)
        toast.error(err.response?.data?.error || "Download failed")
    }
    }
    
    return (
        <div className="dashboard-content">

            <h2 className="text-center mb-4">Grade Assignments</h2>
            
            <div className="d-flex justify-content-end mb-3">
                <button
                    className="btn btn-success"
                    onClick={downloadReport}
                >
                    Download Excel
                </button>
            &nbsp;
                <button
                    className="btn btn-primary"
                    onClick={handleSaveAll}
                    disabled={Object.keys(edited).length === 0}
                >
                    Save All Grades
                </button>
            </div>
            <table className="table table-bordered">

                <thead className="table-dark">
                    <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>File</th>
                    </tr>
                </thead>

                <tbody>

                    {submissions.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="text-center">
                                No submissions
                            </td>
                        </tr>
                    ) : (

                        submissions.map(s => (

                            <tr key={s.submission_id}>

                                <td>{s.name}</td>
                                <td>{s.status}</td>

                                <td>
                                    <input
                                        type="number"
                                        value={s.score || ""}
                                        onChange={(e) =>
                                            handleChange(s.submission_id, e.target.value)
                                        }
                                        className={
                                            `form-control ${edited[s.submission_id] ? "bg-warning-subtle border-warning" : ""

                                        }`}
                                    />
                                </td>

                                {/* ✅ SAFE FILE VIEW */}
                                <td>
                                    {s.file_url ? (
                                        <a
                                            href={`${import.meta.env.VITE_API_URL}/uploads/${s.file_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View File
                                        </a>
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
    )
}