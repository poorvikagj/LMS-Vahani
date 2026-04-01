import { useEffect, useState } from "react"
import API from "../../services/api"
import '../../public/css/dashboard.css'

export default function Assignments() {

    const [assignments, setAssignments] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const res = await API.get("/assignments")
            setAssignments(res.data)
        } catch (err) {
            console.log("Error fetching assignments:", err)
        }
    }

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0])
    }

    const handleSubmit = async (assignment_id) => {

        try {
            // 🔹 For now: just update status (no file upload yet)
            await API.post("/assignments/submit", {
                assignment_id
            })

            alert("Assignment submitted")

            fetchAssignments()

        } catch (err) {
            console.log(err)
            alert("Submission failed")
        }

    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Assignments</h2>

            {assignments.length === 0 ? (
                <p className="text-center">No assignments available</p>
            ) : (

                <div className="row">

                    {assignments.map((a) => (

                        <div className="col-md-4 mb-4" key={a.assignment_id}>

                            <div className="card shadow p-3">

                                <h5>{a.title}</h5>

                                <p><b>Deadline:</b> {a.deadline}</p>

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
                                            onChange={handleFileChange}
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

        </div>
    )
}