import { useState } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"

export default function CreateProgram() {

    const [program_name, setProgramName] = useState("")
    const [program_incharge, setProgramIncharge] = useState("")
    const [total_class, setTotalClass] = useState("")

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!program_name || !program_incharge || !total_class) {
            toast.warn("Fill all fields")
            return
        }

        try {

            await API.post("/programs", {
                program_name,
                program_incharge,
                total_class
            })

            toast.success("Program created successfully")

            setProgramName("")
            setProgramIncharge("")
            setTotalClass("")

        } catch (err) {

            console.log(err)
            toast.error(err.response?.data?.error || "Failed to create program")

        }

    }

    return (

        <>
            <div className="dashboard-content">

            <h2 className="mb-4 text-center">Create Program</h2>

            <form onSubmit={handleSubmit} className="card p-4 shadow">

                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Program Name"
                    value={program_name}
                    onChange={(e) => setProgramName(e.target.value)}
                />

                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Program Incharge"
                    value={program_incharge}
                    onChange={(e) => setProgramIncharge(e.target.value)}
                />

                <input
                    type="number"
                    className="form-control mb-3"
                    placeholder="Total Classes"
                    value={total_class}
                    onChange={(e) => setTotalClass(e.target.value)}
                />

                <button className="btn btn-primary">
                    Create Program
                </button>

            </form>

        </div>

        </>

    )

}