import { useEffect, useState } from "react"
import API from "../../services/api"
import '../../public/css/dashboard.css'

export default function Attendance() {

    const [attendance, setAttendance] = useState([])

    useEffect(() => {
        fetchAttendance()
    }, [])

    const fetchAttendance = async () => {

        const res = await API.get("/attendance")

        setAttendance(res.data)

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

                        {attendance.map(a => (
                            <tr key={a.attendance_id}>
                                <td>{a.class_id}</td>
                                <td>{a.status}</td>
                                <td>{a.marked_at}</td>
                            </tr>
                        ))}

                    </tbody>

                </table>
            </div>
        </>

    )

}