import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API from "../../services/api"
import { toast } from "react-toastify"

export default function ProgramDetails() {

    const { id } = useParams()
    const navigate = useNavigate()

    const [program, setProgram] = useState(null)
    const [students, setStudents] = useState([])
    const [assignments, setAssignments] = useState([])
    const [activeTab, setActiveTab] = useState("assignments")

    // ADD THESE STATES at top (inside component)
    const [attendance, setAttendance] = useState({})
    const [totalClasses, setTotalClasses] = useState(0)

    // ✅ CREATE
    const [showModal, setShowModal] = useState(false)
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        deadline: ""
    })

    // ✅ EDIT
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({
        title: "",
        description: "",
        deadline: ""
    })

    useEffect(() => {
        fetchDetails()
    }, [])

    const fetchDetails = async () => {
        try {
            const res = await API.get(`/programs/${id}/details`)
            setProgram(res.data.program)
            setStudents(res.data.students)
            setAssignments(res.data.assignments)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load program details")
        }
    }

    // ✅ CREATE
    const createAssignment = async () => {
        if (!newAssignment.title || !newAssignment.deadline) {
            toast.warn("Title and deadline are required")
            return
        }
        try {
            await API.post("/assignments/create", {
                ...newAssignment,
                program_id: id
            })

            toast.success("Assignment created successfully ✅")
            setShowModal(false)
            setNewAssignment({ title: "", description: "", deadline: "" })
            fetchDetails()

        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to create assignment")
        }
    }

    // ✅ DELETE
    const handleDelete = async (assignment_id) => {
        if (!window.confirm("Delete this assignment?")) return

        try {
            await API.delete(`/assignments/${assignment_id}`)
            toast.success("Assignment deleted successfully 🗑️")
            fetchDetails()
        } catch (err) {
            console.log(err)
            toast.error("Failed to delete assignment")
        }
    }

    // ✅ START EDIT
    const startEdit = (a) => {
        setEditing(a.assignment_id)
        setForm({
            title: a.title,
            description: a.description || "",
            deadline: a.deadline?.split("T")[0]
        })
    }

    // ✅ CHANGE
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // ✅ UPDATE
    const handleUpdate = async (assignment_id) => {
        try {
            await API.put(`/assignments/${assignment_id}`, form)
            toast.success("Assignment updated successfully ✅")
            setEditing(null)
            fetchDetails()
        } catch (err) {
            toast.error(err.response?.data?.error || "Update failed")
        }
    }

    // FETCH ATTENDANCE
    const fetchAttendance = async () => {
        try {
            const res = await API.get(`/programs/${id}/attendance`)

            setStudents(res.data.students)
            setTotalClasses(res.data.program.total_class)

            // convert to map
            const map = {};
            res.data.attendance.forEach(a => {
                map[`${a.student_id}_${a.class_no}`] = a.status
            })

            setAttendance(map);

        } catch (err) {
            toast.error("Failed to load attendance")
        }
    }


    // LOAD WHEN TAB CHANGES
    useEffect(() => {
        if (activeTab === "attendance" && id) {
            fetchAttendance()
        }
    }, [activeTab])


    // TOGGLE FUNCTION (Present ↔ Absent)
    const toggleAttendance = (studentId, classNo) => {
        const key = `${studentId}_${classNo}`

        setAttendance(prev => ({
            ...prev,
            [key]: prev[key] === "Present" ? "Absent" : "Present"
        }))
    }


    // SAVE ATTENDANCE
    const saveAttendance = async () => {
        const data = []

        Object.keys(attendance).forEach(key => {
            const [student_id, class_no] = key.split("_")

            data.push({
                student_id: Number(student_id),
                class_no: Number(class_no),
                status: attendance[key]
            })
        })

        try {
            await API.post("/attendance/save", { program_id: id, data })
            toast.success("Attendance saved ✅")
        } catch {
            toast.error("Save failed")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">
                {program ? program.program_name : "Loading..."}
            </h2>

            {program && (
                <p className="text-center text-muted">
                    Instructor: {program.program_incharge}
                </p>
            )}

            {/* TABS */}
            <div className="d-flex justify-content-center mb-4 gap-3">

                <button
                    className={`btn ${activeTab === "assignments" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("assignments")}
                >
                    Assignments
                </button>

                <button
                    className={`btn ${activeTab === "attendance" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("attendance")}
                >
                    Update Attendance
                </button>
            </div>

            {/* ASSIGNMENTS */}
            {activeTab === "assignments" && (
                <div className="card p-3 shadow">

                    <div className="d-flex justify-content-between mb-2">
                        <h5>Assignments</h5>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            + Create Assignment
                        </button>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Deadline</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {assignments.map(a => (

                                <tr key={a.assignment_id}>

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

                                            <td>
                                                <input
                                                    type="date"
                                                    name="deadline"
                                                    value={form.deadline}
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
                                                    className="btn btn-danger btn-sm me-2"
                                                    onClick={() => handleDelete(a.assignment_id)}
                                                >
                                                    Delete
                                                </button>

                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => navigate(`/grade/${a.assignment_id}`)}
                                                >
                                                    Grade
                                                </button>
                                            </td>
                                        </>
                                    )}

                                </tr>

                            ))}
                        </tbody>

                    </table>
                </div>
            )}

            {/* ATTENDANCE */}
            {activeTab === "attendance" && (
                <div className="card p-3 shadow">
                    <h5>Attendance</h5>

                    <div style={{ overflowX: "auto", overflowY: "auto" }}>
                        <table className="table table-bordered text-center">

                            {/* HEADER */}
                            <thead>
                                <tr>
                                    <th>&nbsp;&nbsp;&nbsp;Batch&nbsp;&nbsp;&nbsp;</th>
                                    <th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
                                    {[...Array(totalClasses)].map((_, i) => (
                                        <th key={i}>&nbsp;&nbsp;&nbsp;Class&nbsp;&nbsp;&nbsp; {i + 1}</th>
                                    ))}
                                    
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.student_id}>
                                        <td>{s.batch}</td>
                                        <td>{s.name}</td>

                                        {[...Array(totalClasses)].map((_, i) => {
                                            const classNo = i + 1
                                            const key = `${s.student_id}_${classNo}`
                                            const status = attendance[key]|| "Absent";
                                            console.log(s.student_id, classNo, status);
                                            return (
                                                <td key={classNo}>
                                                    <button
                                                        className={`btn btn-sm ${status === "Present"
                                                            ? "btn-success"
                                                            : "btn-danger"
                                                            }`}
                                                        onClick={() =>
                                                            toggleAttendance(s.student_id, classNo)
                                                        }
                                                    >
                                                        {status === "Present" ? "✔" : "✖"}
                                                    </button>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                    <button className="btn btn-primary mt-3" onClick={saveAttendance}>
                        Save Attendance
                    </button>
                </div>
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5>Create Assignment</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>

                            <div className="modal-body">
                                <input
                                    placeholder="Title"
                                    className="form-control mb-2"
                                    value={newAssignment.title}
                                    onChange={(e) =>
                                        setNewAssignment({ ...newAssignment, title: e.target.value })
                                    }
                                />

                                <textarea
                                    placeholder="Description"
                                    className="form-control mb-2"
                                    value={newAssignment.description}
                                    onChange={(e) =>
                                        setNewAssignment({ ...newAssignment, description: e.target.value })
                                    }
                                />

                                <input
                                    type="date"
                                    className="form-control"
                                    value={newAssignment.deadline}
                                    onChange={(e) =>
                                        setNewAssignment({ ...newAssignment, deadline: e.target.value })
                                    }
                                />
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-success" onClick={createAssignment}>Create</button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}