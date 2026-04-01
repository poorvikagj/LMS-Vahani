import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import API from "../../services/api"

export default function GradeAssignments() {

    const { id } = useParams()
    const [submissions, setSubmissions] = useState([])

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const fetchSubmissions = async () => {
        try {
            const res = await API.get(`/assignments/${id}/submissions`)
            setSubmissions(res.data)
        } catch (err) {
            console.log("Error fetching submissions:", err)
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
    }

    const handleSave = async (submission_id, score) => {

        try {

            await API.put(`/assignments/grade/${submission_id}`, { score })

            alert("Score updated")
            fetchSubmissions()

        } catch (err) {
            console.log(err)
            alert("Update failed")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="text-center mb-4">Grade Assignments</h2>

            <table className="table table-bordered">

                <thead className="table-dark">
                    <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>File</th>
                        <th>Action</th>
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
                                        className="form-control"
                                    />
                                </td>

                                {/* ✅ SAFE FILE VIEW */}
                                <td>
                                    {s.file_url ? (
                                        <a
                                            href={`http://localhost:5000/uploads/${s.file_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View File
                                        </a>
                                    ) : (
                                        <span className="text-muted">No file</span>
                                    )}
                                </td>

                                <td>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() =>
                                            handleSave(s.submission_id, s.score)
                                        }
                                    >
                                        Save
                                    </button>
                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>
    )
}