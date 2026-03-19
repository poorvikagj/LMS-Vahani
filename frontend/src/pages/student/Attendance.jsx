import Layout from "../../components/Layout"
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
                    <Layout></Layout>
                    <div className="dashboard">
                <h2>Attendance</h2>

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