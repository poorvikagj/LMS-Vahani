import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../../services/api"
import { toast } from "react-toastify"

export default function Programs() {

    const [programs, setPrograms] = useState([])

    const [editProgram, setEditProgram] = useState(null)
    const [formData, setFormData] = useState({
        program_name: "",
        program_incharge: "",
        total_class: ""
    })

    const navigate = useNavigate()

    useEffect(() => {
        fetchPrograms()
    }, [])

    // Fetch programs
    const fetchPrograms = async () => {
        try {
            const res = await API.get("/programs")
            setPrograms(res.data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load programs")
        }
    }

    // Delete program
    const deleteProgram = async (id) => {
        if (!window.confirm("Are you sure you want to delete this program?")) return

        try {
            await API.delete(`/programs/${id}`)
            toast.success("Program deleted successfully")
            fetchPrograms()
        } catch (err) {
            toast.error(err.response?.data?.error || "Delete failed")
        }
    }

    // Handle input change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // Update program
    const updateProgram = async () => {

        if (!formData.program_name || !formData.program_incharge || !formData.total_class) {
            toast.warn("Please fill all fields")
            return
        }

        try {
            await API.put(`/programs/${editProgram.program_id}`, formData)

            toast.success("Program updated successfully")

            setEditProgram(null)
            fetchPrograms()

        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.error || "Update failed")
        }
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Programs</h2>

            <div className="row">

                {programs.map(program => (

                    <div
                        className="col-md-4 mb-4"
                        key={program.program_id}
                        onClick={() => navigate(`/programs/${program.program_id}`)}
                    >

                        <div className="card shadow p-3">

                            <h5>{program.program_name}</h5>

                            <p>
                                <b>Instructor:</b> {program.program_incharge}
                            </p>

                            <p>
                                <b>Total Classes:</b> {program.total_class}
                            </p>

                            {/* Admin actions */}
                            <div className="d-flex gap-2">

                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
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

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteProgram(program.program_id)
                                    }}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

            {/* Edit Modal */}
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