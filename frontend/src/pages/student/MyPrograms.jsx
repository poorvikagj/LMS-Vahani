import { useState, useEffect } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"
import "../../public/css/analytics-dashboard.css"
import StudentChatAssistant from "../../components/ai/StudentChatAssistant"

export default function MyPrograms() {

    const [myPrograms, setMyPrograms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyPrograms()
    }, [])

    const fetchMyPrograms = async () => {

        try {

            const res = await API.get("/programs/my-programs")

            setMyPrograms(res.data)

        } catch (err) {

            console.log(err)
            toast.error("Failed to load programs")

        } finally {

            setLoading(false)

        }

    }

    return (

        <>
            <div className="dashboard-content">

                <div className="analytics-header-wrap mb-4">
                    <h2 className="analytics-heading mb-1">My Programs</h2>
                    <p className="analytics-subheading mb-0">View your enrolled programs, incharge details, and class coverage.</p>
                </div>

                {loading ? (

                    <p className="text-center">Loading programs...</p>

                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered">

                            <thead className="table-dark">

                                <tr>
                                    <th>Program</th>
                                    <th>Program Incharge</th>
                                    <th>Total Classes</th>
                                </tr>

                            </thead>

                            <tbody>

                                {myPrograms.length === 0 ? (

                                    <tr>
                                        <td colSpan="3" className="text-center">
                                            No programs enrolled
                                        </td>
                                    </tr>

                                ) : (

                                    myPrograms.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.program_name}</td>
                                            <td>{p.program_incharge}</td>
                                            <td>{p.total_class}</td>
                                        </tr>
                                    ))

                                )}

                            </tbody>
                        </table>
                    </div>
                )}

                <StudentChatAssistant />
            </div>

        </>

    )

}