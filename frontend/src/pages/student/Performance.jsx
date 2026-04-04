import { useEffect, useState } from "react"
import API from "../../services/api"
import { toast } from "react-toastify"

export default function Performance() {

    const [performance, setPerformance] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPerformance()
    }, [])

    const fetchPerformance = async () => {
        try {

            const res = await API.get("/performance")
            setPerformance(res.data)

        } catch (err) {

            console.log(err)
            toast.error("Failed to load performance")

        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-content">
                <h3 className="text-center text-muted">Loading performance...</h3>
            </div>
        )
    }

    return (
        <div className="dashboard-content">

            <h2 className="mb-4 text-center">Performance</h2>

            <table className="table table-bordered">

                <thead className="table-dark">
                    <tr>
                        <th>Program</th>
                        <th>Assignments</th>
                        <th>Tests</th>
                        <th>Score</th>
                    </tr>
                </thead>

                <tbody>

                    {performance.length === 0 ? (

                        <tr>
                            <td colSpan="4" className="text-center">
                                No performance data
                            </td>
                        </tr>

                    ) : (

                        performance.map((p, i) => {

                            // ✅ Safe percentage calculation
                            const percent = p.total_assignments
                                ? Math.round((p.assignments_completed / p.total_assignments) * 100)
                                : 0

                            const scorePercent = p.score

                            return (
                                <tr key={i}>

                                    <td>{p.program_name}</td>

                                    {/* ✅ Progress Bar */}
                                    <td>
                                        <div>
                                            <div style={{
                                                height: "8px",
                                                background: "#e0e0e0",
                                                borderRadius: "5px",
                                                overflow: "hidden",
                                                marginBottom: "5px"
                                            }}>
                                                <div
                                                    style={{
                                                        width: `${percent}%`,
                                                        background: "#28a745",
                                                        height: "100%",
                                                        transition: "width 0.5s ease"
                                                    }}
                                                ></div>
                                            </div>

                                            <small>
                                                {p.assignments_completed}/{p.total_assignments} ({percent}%)
                                            </small>
                                        </div>
                                    </td>

                                    {/* Tests */}
                                    <td>
                                        {p.tests_completed} / {p.total_tests}
                                    </td>

                                    {/* ✅ Score */}
                                    <td className={
                                        scorePercent >= 80
                                            ? "text-success"
                                            : scorePercent >= 50
                                                ? "text-warning"
                                                : "text-danger"
                                    }>
                                        <b>{scorePercent}%</b>
                                    </td>

                                </tr>
                            )
                        })

                    )}

                </tbody>

            </table>

        </div>
    )
}