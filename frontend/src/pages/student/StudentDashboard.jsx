import Layout from "../../components/Layout"
import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import API from "../../services/api"

export default function StudentDashboard() {

    const [enrolledCount, setEnrolledCount] = useState(0)
    const [pendingAssignments, setPendingAssignments] = useState(0)
    const [completedCourses, setCompletedCourses] = useState(0)

    const [searchParams] = useSearchParams()

    useEffect(() => {

        // Handle Google OAuth redirect
        const token = searchParams.get("token")

        if (token) {

            localStorage.setItem("token", token)
            localStorage.setItem("role", "student")

            // remove token from URL
            window.history.replaceState({}, document.title, "/student-dashboard")

        }

        fetchDashboardData()

    }, [])

    const fetchDashboardData = async () => {

        try {

            // enrolled programs
            const programRes = await API.get("/programs/my-programs")
            setEnrolledCount(programRes.data.length)

            // optional APIs (future)
            setPendingAssignments(2)
            setCompletedCourses(1)

        } catch (err) {

            console.log(err)

        }

    }

    return (

        <Layout>
            <div style={{ position: "fixed", left: "270px", width: "1400px" }}>
                <h2 className="mb-4" style={{ color: "black" }}>Student Dashboard</h2>
                <div className="row">

                    <div className="col-md-4">

                        <div className="card text-center shadow">

                            <div className="card-body">

                                <h5>Enrolled Programs</h5>

                                <h2>{enrolledCount}</h2>

                            </div>

                        </div>

                    </div>

                    <div className="col-md-4">

                        <div className="card text-center shadow">

                            <div className="card-body">

                                <h5>Pending Assignments</h5>

                                <h2>{pendingAssignments}</h2>

                            </div>

                        </div>

                    </div>

                    <div className="col-md-4">

                        <div className="card text-center shadow">

                            <div className="card-body">

                                <h5>Completed Courses</h5>

                                <h2>{completedCourses}</h2>

                            </div>

                        </div>

                    </div>

                </div>
            </div>

        </Layout>

    )

}