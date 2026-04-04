import { useEffect, useState } from "react"
import { Bar, Doughnut } from "react-chartjs-2"
import { getAnalytics } from "../../services/adminService"

export default function Analytics() {

    const [data, setData] = useState([])

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        const res = await getAnalytics()
        setData(res)
    }

    return (
        <div className="dashboard-content container mt-4">

            <h2>Analytics</h2>

            <div className="row">

                {data.map(program => (

                    <div className="col-md-6 mb-4 p-3" key={program.program_id}>

                        <div className="card p-3 shadow">

                            <h4>{program.program_name}</h4>

                            <p>Students Enrolled: {program.total_students}</p>

                            {/* 📊 Classes Progress */}
                            <div className="mb-3" style={{width:"300px"}} >
                            <Doughnut
                                data={{
                                    labels: ["Completed", "Remaining"],
                                    datasets: [{
                                        data: [
                                            program.classes_completed,
                                            program.total_class - program.classes_completed
                                        ]
                                    }]
                                }}
                            />
                            </div>

                            {/* 📊 Attendance */}
                            <p>Avg Attendance: {program.avg_attendance_percentage}%</p>

                            {/* 📊 Submission */}
                            <Bar
                                data={{
                                    labels: ["Assignment Submission Rate"],
                                    datasets: [{
                                        label: "%",
                                        data: [program.overall_submission_rate]
                                    }]
                                }}
                            />

                        </div>

                    </div>

                ))}

            </div>

        </div>
    )
}