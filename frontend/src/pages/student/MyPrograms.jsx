import { useEffect, useState } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"
import "../../public/css/analytics-dashboard.css"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function MyPrograms() {

    const [programs, setPrograms] = useState([])
    const [myPrograms, setMyPrograms] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res1 = await API.get("/programs")
            const res2 = await API.get("/programs/my-programs")

            setPrograms(res1.data)
            setMyPrograms(res2.data)

        } catch (err) {
            console.log(err)
            toast.error("Failed to load programs")
        } finally {
            setLoading(false)
        }
    }

    // Check enrolled
    const isEnrolled = (programId) => {
        return myPrograms.some(p => p.program_id === programId)
    }

    // Enroll
    const enrollProgram = async (id) => {
        try {
            await API.post("/programs/enroll", { program_id: id })
            toast.success("Enrolled successfully")
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.error || "Enrollment failed")
        }
    }

    // Filter logic
    const filteredPrograms = programs.filter(p => {
        if (tab === "enrolled") return isEnrolled(p.program_id)
        if (tab === "not-enrolled") return !isEnrolled(p.program_id)
        return true
    })

    return (
        <div className="dashboard-content">

            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading mb-1">My Programs</h2>
                <p className="analytics-subheading mb-0">Browse all programs, see enrollment status, and enroll directly from this page.</p>
            </div>

            <div className="tabs mb-3">
                <button
                    className={tab === "all" ? "tab active" : "tab"}
                    onClick={() => setTab("all")}
                >
                    ALL
                </button>

                <button
                    className={tab === "enrolled" ? "tab active" : "tab"}
                    onClick={() => setTab("enrolled")}
                >
                    ENROLLED
                </button>

                <button
                    className={tab === "not-enrolled" ? "tab active" : "tab"}
                    onClick={() => setTab("not-enrolled")}
                >
                    NOT ENROLLED
                </button>
            </div>

            {/* 🔹 Content */}
            {loading ? (
                <p className="text-center">Loading programs...</p>
            ) : filteredPrograms.length === 0 ? (
                <p className="text-center">No programs found</p>
            ) : (

                <div className="row">

                    {filteredPrograms.map(program => (

                        <div className="col-md-4 mb-4" key={program.program_id}>

                            <div className="card shadow p-3">

                                <h5>{program.program_name}</h5>

                                <p>
                                    <b>Instructor:</b> {program.program_incharge}
                                </p>

                                <p>
                                    <b>Total Classes:</b> {program.total_class}
                                </p>

                                {/* 🔥 Button */}
                                <button
                                className={`btn btn-sm ${
                                    isEnrolled(program.program_id)
                                    ? "btn-secondary"
                                    : "btn-warning"
                                }`}
                                disabled={isEnrolled(program.program_id)}
                                onClick={() => enrollProgram(program.program_id)}
                                >
                                {isEnrolled(program.program_id) ? "Enrolled" : "Enroll"}
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

            <StudentChatAssistant />

        </div>
    )
}