import { useEffect, useState } from "react"
import API from "../../services/api"
import '../../public/css/dashboard.css'
import '../../public/css/analytics-dashboard.css'
import { toast } from "react-toastify"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function Assignments() {

    const [assignments, setAssignments] = useState([])
    const [files, setFiles] = useState({})

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const res = await API.get("/assignments")
            setAssignments(res.data)
        } catch (err) {
            console.log("Error fetching assignments:", err)
            toast.error("Failed to load assignments")
        }
    }

    const handleFileChange = (e, assignment_id) => {
        setFiles({
            ...files,
            [assignment_id]: e.target.files[0]
        })
    }

    const handleSubmit = async (assignment_id) => {

        // 🔥 VALIDATION
        if (!files[assignment_id]) {
            toast.warn("Please select a file")
            return
        }

        const formData = new FormData()
        formData.append("assignment_id", assignment_id)
        formData.append("file", files[assignment_id])
        try {

            await API.post("/assignments/submit", formData)

            toast.success("Submitted successfully")

            fetchAssignments()

        } catch (err) {

            console.log(err)
            toast.error(err.response?.data?.error || "Submission failed")
        }
    }

    return (
        <div className="dashboard-content">

            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">Assignments</h2>
                <p className="analytics-subheading mb-0">Track deadlines, submit files, and monitor grading status for each assignment.</p>
            </div>

            {assignments.length === 0 ? (
                <p className="text-center">No assignments available</p>
            ) : (

                <div className="row">

                    {assignments.map((a) => (

                        <div className="col-md-4 mb-4" key={a.assignment_id}>

                            <div className="card shadow p-3">

                                <h5>{a.title}</h5>

                                <p>
                                    <b>Deadline:</b>{" "}
                                    {new Date(a.deadline).toLocaleDateString("en-GB")}
                                </p>

                                <p>
                                    <b>Status:</b>{" "}
                                    <span className={
                                        a.status === "Submitted"
                                            ? "text-success"
                                            : "text-danger"
                                    }>
                                        {a.status}
                                    </span>
                                </p>

                                {a.status === "Pending" && (
                                    <>
                                        <input
                                            type="file"
                                            className="form-control mb-2"
                                            onChange={(e) =>
                                                handleFileChange(e, a.assignment_id)
                                            }
                                        />

                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleSubmit(a.assignment_id)}
                                        >
                                            Submit
                                        </button>
                                    </>
                                )}

                                {a.score !== null && (
                                    <p className="mt-2">
                                        <b>Score:</b> {a.score}
                                    </p>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}

            <StudentChatAssistant />

        </div>
    )
}