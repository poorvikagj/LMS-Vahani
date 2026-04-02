import { useEffect, useState } from "react"
import API from "../../services/api"
import '../../public/css/dashboard.css'
import { toast } from "react-toastify"

export default function Attendance() {

    const [attendance, setAttendance] = useState([])

    useEffect(() => {
        fetchAttendance()
    }, [])

    const fetchAttendance = async () => {
        try {
            const res = await API.get("/attendance")
            setAttendance(res.data)
        } catch (err) {
            console.log(err)
            toast.error("Failed to load attendance")
        }
    }

    return (

        <>
            <div className="dashboard-content">
                <h2 className="mb-4 text-center">Attendance</h2>

                <table className="table table-bordered">

                    <thead className="table-dark">
                        <tr>
                            <th>Class</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>

                    <tbody>

                        {attendance.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center">
                                    No attendance records
                                </td>
                            </tr>
                        ) : (
                            attendance.map(a => (
                                <tr key={a.attendance_id}>
                                    <td>{a.class_id}</td>
                                    <td className={a.status === "Present" ? "text-success" : "text-danger"}>
                                        {a.status}
                                    </td>
                                    <td>{new Date(a.marked_at).toLocaleDateString("en-GB")}</td>
                                </tr>
                            ))
                        )}

                    </tbody>

                </table>
            </div>
        </>

    )

}