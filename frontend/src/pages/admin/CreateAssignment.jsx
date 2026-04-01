import { useState, useEffect } from "react"
import API from "../../services/api"

export default function CreateAssignment() {

    const [programs, setPrograms] = useState([])

    const [form, setForm] = useState({
        program_id: "",
        title: "",
        description: "",
        deadline: ""
    })

    useEffect(() => {
        fetchPrograms()
    }, [])

    const fetchPrograms = async () => {
        try {
            const res = await API.get("/programs")
            setPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!form.program_id || !form.title || !form.deadline) {
            alert("Please fill all fields")
            return
        }

        try {

            await API.post("/assignments/create", form)

            alert("Assignment created successfully")

            setForm({
                program_id: "",
                title: "",
                description: "",
                deadline: ""
            })

        } catch (err) {
            console.log(err)
            alert("Failed to create assignment")
        }

    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Create Assignment</h2>

            <form onSubmit={handleSubmit} className="card p-4 shadow">

                {/* Program Dropdown */}
                <select
                    name="program_id"
                    className="form-control mb-3"
                    value={form.program_id}
                    onChange={handleChange}
                >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                        <option key={p.program_id} value={p.program_id}>
                            {p.program_name}
                        </option>
                    ))}
                </select>

                {/* Title */}
                <input
                    type="text"
                    name="title"
                    placeholder="Assignment Title"
                    className="form-control mb-3"
                    value={form.title}
                    onChange={handleChange}
                />

                {/* Description */}
                <textarea
                    name="description"
                    placeholder="Description"
                    className="form-control mb-3"
                    value={form.description}
                    onChange={handleChange}
                />

                {/* Deadline */}
                <input
                    type="date"
                    name="deadline"
                    className="form-control mb-3"
                    value={form.deadline}
                    onChange={handleChange}
                />

                <button className="btn btn-primary">
                    Create Assignment
                </button>

            </form>

        </div>
    )
}