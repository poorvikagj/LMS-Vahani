import { useEffect, useState } from "react"
import API from "../../services/api"

export default function Programs() {

    const [programs, setPrograms] = useState([])
    const [myPrograms, setMyPrograms] = useState([])

    const role = localStorage.getItem("role")

    useEffect(() => {
        fetchPrograms()

        if (role === "student") {
            fetchMyPrograms()
        }

    }, [])

    const fetchPrograms = async () => {
        try {
            const res = await API.get("/programs")
            setPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const fetchMyPrograms = async () => {
        try {
            const res = await API.get("/programs/my-programs")
            setMyPrograms(res.data)
        } catch (err) {
            console.log(err)
        }
    }

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

                                {/* 🔥 ROLE BASED UI */}

                                {role === "admin" ? (

                                    <div className="d-flex gap-2">
                                        <button className="btn btn-warning btn-sm">
                                            Edit
                                        </button>

                                        <button className="btn btn-danger btn-sm">
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

        </div>
    )
}