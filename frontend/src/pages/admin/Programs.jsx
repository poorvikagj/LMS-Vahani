import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../../services/api"

export default function Programs() {

    const [programs, setPrograms] = useState([])
    const [myPrograms, setMyPrograms] = useState([])

    // ✅ EDIT STATES
    const [editProgram, setEditProgram] = useState(null)
    const [formData, setFormData] = useState({
        program_name: "",
        program_incharge: "",
        total_class: ""
    })

    const role = localStorage.getItem("role")
    const navigate = useNavigate()

    useEffect(() => {
        fetchPrograms()

        if (role === "student") {
            fetchMyPrograms()
        }
    }, [])

    // ✅ FETCH PROGRAMS
    const fetchPrograms = async () => {
        try {
            const res = await API.get("/programs")
            setPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    // ✅ FETCH MY PROGRAMS
    const fetchMyPrograms = async () => {
        try {
            const res = await API.get("/programs/my-programs")
            setMyPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    // ✅ DELETE PROGRAM
    const deleteProgram = async (id) => {
        if (!window.confirm("Are you sure to delete?")) return

        try {
            await API.delete(`/programs/${id}`)
            alert("Program deleted")
            fetchPrograms()
        } catch (err) {
            alert("Delete failed")
        }
    }

    // ✅ ENROLL PROGRAM
    const enrollProgram = async (id) => {
        try {
            await API.post("/programs/enroll", {
                program_id: id
            })

            alert("Enrolled Successfully")
            fetchMyPrograms()

        } catch (err) {
            if (err.response?.data?.error === "Already enrolled") {
                alert("Already enrolled")
            } else {
                alert("Enrollment failed")
            }
        }
    }

    const isEnrolled = (programId) => {
        return myPrograms.some(p => p.program_id === programId)
    }

    // ✅ HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // ✅ UPDATE PROGRAM
    const updateProgram = async () => {
        try {
            await API.put(`/programs/${editProgram.program_id}`, formData)

            alert("Program updated successfully")

            setEditProgram(null)
            fetchPrograms()

        } catch (err) {
            console.log(err)
            alert("Update failed")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Programs</h2>

            <div className="row">

                {programs.map(program => (

                    <div className="col-md-4 mb-4" key={program.program_id}>

                        <div className="card shadow">

                            <div className="card-body">

                                <h5>{program.program_name}</h5>

                                <p>Instructor: {program.program_incharge}</p>
                                <p>Total Classes: {program.total_class}</p>

                                {role === "admin" ? (

                                    <div className="d-flex gap-2">

                                        {/* ✅ VIEW → NAVIGATE */}
                                        <button
                                            className="btn btn-info btn-sm"
                                            onClick={() => navigate(`/programs/${program.program_id}`)}
                                        >
                                            View
                                        </button>

                                        {/* ✅ EDIT */}
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => {
                                                setEditProgram(program)
                                                setFormData({
                                                    program_name: program.program_name,
                                                    program_incharge: program.program_incharge,
                                                    total_class: program.total_class
                                                })
                                            }}
                                        >
                                            Edit
                                        </button>

                                        {/* ✅ DELETE */}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => deleteProgram(program.program_id)}
                                        >
                                            Delete
                                        </button>

                                    </div>

                                ) : (

                                    <button
                                        className={`btn btn-sm ${
                                            isEnrolled(program.program_id)
                                                ? "btn-secondary"
                                                : "btn-primary"
                                        }`}
                                        disabled={isEnrolled(program.program_id)}
                                        onClick={() => enrollProgram(program.program_id)}
                                    >
                                        {isEnrolled(program.program_id)
                                            ? "Enrolled"
                                            : "Enroll"}
                                    </button>

                                )}

                            </div>

                        </div>

                    </div>

                ))}

            </div>

            {/* ✅ EDIT MODAL */}
            {editProgram && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5>Edit Program</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setEditProgram(null)}
                                ></button>
                            </div>

                            <div className="modal-body">

                                <input
                                    type="text"
                                    name="program_name"
                                    value={formData.program_name}
                                    onChange={handleChange}
                                    className="form-control mb-2"
                                    placeholder="Program Name"
                                />

                                <input
                                    type="text"
                                    name="program_incharge"
                                    value={formData.program_incharge}
                                    onChange={handleChange}
                                    className="form-control mb-2"
                                    placeholder="Instructor"
                                />

                                <input
                                    type="number"
                                    name="total_class"
                                    value={formData.total_class}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Total Classes"
                                />

                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditProgram(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-success"
                                    onClick={updateProgram}
                                >
                                    Update
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}