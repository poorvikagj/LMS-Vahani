import { useEffect, useState } from "react"
import API from "../../services/api"
import { useNavigate } from "react-router-dom"
export default function ManageAssignments() {
    
    const navigate = useNavigate()
    const [assignments, setAssignments] = useState([])
    const [editing, setEditing] = useState(null)

    const [form, setForm] = useState({
        title: "",
        description: "",
        deadline: ""
    })

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const res = await API.get("/assignments/admin")
            setAssignments(res.data)
        } catch (err) {
            console.log("Error fetching assignments:", err)
        }
    }

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this assignment?")) return

        try {
            await API.delete(`/assignments/${id}`)
            fetchAssignments()
        } catch (err) {
            console.log("Delete error:", err)
        }
    }

    const startEdit = (assignment) => {

        setEditing(assignment.assignment_id)

        setForm({
            title: assignment.title,
            description: assignment.description || "",
            deadline: assignment.deadline?.split("T")[0]   // ✅ correct format
        })
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleUpdate = async (id) => {

        try {

            await API.put(`/assignments/${id}`, form)

            alert("Updated successfully")

            setEditing(null)
            fetchAssignments()

        } catch (err) {
            console.log("Update error:", err)
            alert("Update failed")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Assignment Management</h2>

            <table className="table table-bordered">

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

                                {/* EDIT MODE */}
                                {editing === a.assignment_id ? (
                                    <>
                                        <td>
                                            <input
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </td>

                                        <td>{a.program_name}</td>

                                        <td>
                                            <input
                                                type="date"
                                                name="deadline"
                                                value={form.deadline}   // ✅ FIXED
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </td>

                                        <td>
                                            <button
                                                className="btn btn-success btn-sm me-2"
                                                onClick={() => handleUpdate(a.assignment_id)}
                                            >
                                                Save
                                            </button>

                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setEditing(null)}
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (

                                    <>
                                        <td>{a.title}</td>
                                        <td>{a.program_name}</td>

                                        {/* ✅ FIXED DATE DISPLAY */}
                                        <td>
                                            {new Date(a.deadline).toLocaleDateString("en-GB")}
                                        </td>

                                        <td>
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => startEdit(a)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(a.assignment_id)}
                                            >
                                                Delete
                                            </button>
                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                onClick={() => navigate(`/grade/${a.assignment_id}`)}
                                            >
                                            Grade
                                            </button>
                                        </td>
                                    </>
                                )}

                            </tr>

                        ))

                    )}

                </tbody>

            </table>
        </div>
    )
}