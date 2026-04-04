import { useEffect, useState } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"

export default function ManageAssignments() {

    const [assignments, setAssignments] = useState([])

    // ✅ COUNTS STATE
    const [counts, setCounts] = useState({})

    // ✅ MODAL STATE
    const [modalData, setModalData] = useState([])
    const [modalTitle, setModalTitle] = useState("")
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchAssignments()
    }, [])

    // ✅ FETCH ASSIGNMENTS + COUNTS
    const fetchAssignments = async () => {
        try {
            const res = await API.get("/assignments/admin")
            setAssignments(res.data)

            // 🔥 Fetch counts for each assignment
            res.data.forEach(a => fetchCounts(a.assignment_id))

        } catch (err) {
            console.log(err)
            toast.error("Failed to load assignments")
        }
    }

    // ✅ FETCH COUNTS
    const fetchCounts = async (assignment_id) => {
        try {
            const upload = await API.get(`/assignments/${assignment_id}/pending-upload`)
            const grade = await API.get(`/assignments/${assignment_id}/pending-grade`)

            setCounts(prev => ({
                ...prev,
                [assignment_id]: {
                    upload: upload.data.count,
                    review: grade.data.count
                }
            }))

        } catch (err) {
            console.log(err)
            toast.error("Failed to load assignment counts")
        }
    }

    // ✅ FETCH UPLOAD PENDING
    const fetchUploadPending = async (id) => {
        try {
            const res = await API.get(`/assignments/${id}/pending-upload`)
            setModalData(res.data.students)   // ✅ FIXED
            setModalTitle("Upload Pending Students")
            setShowModal(true)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load upload pending students")
        }
    }

    // ✅ FETCH GRADE PENDING
    const fetchReviewPending = async (id) => {
        try {
            const res = await API.get(`/assignments/${id}/pending-grade`)
            setModalData(res.data.students)   // ✅ FIXED
            setModalTitle("Review Pending Students")
            setShowModal(true)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load grade pending students")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Assignment Management</h2>
            <div className="table-responsive">
                <table className="table">

                    <thead className="table-dark">
                        <tr>
                            <th>Assignment</th>
                            <th>Program</th>
                            <th>Deadline</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>

                        {assignments.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No assignments found
                                </td>
                            </tr>
                        ) : (

                            assignments.map((a) => (

                                <tr key={a.assignment_id}>

                                    <td>{a.title}</td>
                                    <td>{a.program_name}</td>

                                    <td>
                                        {new Date(a.deadline).toLocaleDateString("en-GB")}
                                    </td>

                                    <td>

                                        {/* 🟡 UPLOAD PENDING */}
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={() => fetchUploadPending(a.assignment_id)}
                                        >
                                            Upload Pending ({counts[a.assignment_id]?.upload || 0})
                                        </button>

                                        {/* 🔴 GRADE PENDING */}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => fetchReviewPending(a.assignment_id)}
                                        >
                                            Review Pending ({counts[a.assignment_id]?.review || 0})
                                        </button>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>
            </div>
            {/* ✅ MODAL */}
            {showModal && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5>{modalTitle}</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">

                                {modalData.length === 0 ? (
                                    <p>No students</p>
                                ) : (
                                    <ul className="list-group">
                                        {modalData.map((s, i) => (
                                            <li key={i} className="list-group-item">
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}