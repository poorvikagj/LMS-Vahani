import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getStudentsReport } from "../../services/studentService"
import { toast } from "react-toastify"

export default function StudentReport() {

    const { id } = useParams()
    const [report, setReport] = useState(null)

    useEffect(() => {
        fetchReport()
    }, [])

    const fetchReport = async () => {
        try {
            const data = await getStudentsReport(id)
            setReport(data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load report")
        }
    }

    if (!report) return <p>Loading...</p>

    return (
        <div className=" dashboard-content container mt-4">
            <h3>{report.name}'s Report</h3>
            <p>Email: {report.email}</p>
            <p>Batch: {report.batch}</p>

            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Program</th>
                        <th>Classes Attended</th>
                        <th>Total Classes</th>
                        <th>Attendence Percentage</th>
                        <th>Assignments Submitted</th>
                        <th>Assignment Submission Rate</th>

                    </tr>
                </thead>
                <tbody>
                    {report.programs.map((p, index) => (
                        <tr key={index}>
                            <td>{p.program_name}</td>
                            <td>{p.classes_attended}</td>
                            <td>{p.total_classes}</td>
                            <td>{p.attendance_percentage}%</td>
                            <td>{p.assignments_submitted}</td>
                            <td>{p.assignment_submission_percentage}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}