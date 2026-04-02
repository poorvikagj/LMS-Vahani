import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import API from "../../services/api"

export default function ProgramDetails() {

    const { id } = useParams()

    const [program, setProgram] = useState(null)   // ✅ NEW
    const [students, setStudents] = useState([])
    const [assignments, setAssignments] = useState([])
    const [activeTab, setActiveTab] = useState("students")

    useEffect(() => {
        fetchDetails()
    }, [])

    const fetchDetails = async () => {
        try {
            const res = await API.get(`/programs/${id}/details`)

            setProgram(res.data.program)   // ✅ NEW
            setStudents(res.data.students)
            setAssignments(res.data.assignments)

        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="dashboard-content">

            {/* ✅ DYNAMIC TITLE */}
            <h2 className="mb-4 text-center">
                {program ? program.program_name : "Loading..."}
            </h2>

            {/* OPTIONAL INFO */}
            {program && (
                <p className="text-center text-muted">
                    Instructor: {program.program_incharge}
                </p>
            )}

            {/* 🔥 TAB BUTTONS */}
            <div className="d-flex justify-content-center mb-4 gap-3">
                <button
                    className={`btn ${
                        activeTab === "students" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("students")}
                >
                    Students
                </button>

                <button
                    className={`btn ${
                        activeTab === "assignments" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("assignments")}
                >
                    Assignments
                </button>
            </div>

            {/* 🔥 STUDENTS TAB */}
            {activeTab === "students" && (
                <div className="card p-3 shadow">

                    <h5>Enrolled Students</h5>

                    {students.length === 0 ? (
                        <p>No students enrolled</p>
                    ) : (
                        <table className="table mt-3">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.student_id}>
                                        <td>{s.student_id}</td>
                                        <td>{s.name}</td>
                                        <td>{s.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </div>
            )}

            {/* 🔥 ASSIGNMENTS TAB */}
            {activeTab === "assignments" && (
                <div className="card p-3 shadow">

                    <h5>Assignments</h5>

                    {assignments.length === 0 ? (
                        <p>No assignments</p>
                    ) : (
                        <table className="table mt-3">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => (
                                    <tr key={a.assignment_id}>
                                        <td>{a.assignment_id}</td>
                                        <td>{a.title}</td>
                                        <td>{a.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </div>
            )}

        </div>
    )
}