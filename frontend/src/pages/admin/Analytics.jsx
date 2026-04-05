import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getAnalytics, getStudentAnalytics } from "../../services/adminService"
import AnalyticsChatAssistant from "../../components/ai/AnalyticsChatAssistant"
import "../../public/css/analytics-dashboard.css"

export default function Analytics() {

    const [analyticsData, setAnalyticsData] = useState([])
    const [overallStudents, setOverallStudents] = useState(0)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const [analyticsRes, studentsRes] = await Promise.all([
                getAnalytics(),
                getStudentAnalytics()
            ])

            setAnalyticsData(Array.isArray(analyticsRes) ? analyticsRes : [])
            setOverallStudents(Number(studentsRes?.totalStudents || 0))
        } catch (error) {
            setAnalyticsData([])
            setOverallStudents(0)
        }
    }

    const summary = useMemo(() => {
        const activeCourses = analyticsData.length

        const avgScore = activeCourses
            ? analyticsData.reduce((sum, item) => sum + Number(item.overall_submission_rate || 0), 0) / activeCourses
            : 0

        return {
            totalStudents: overallStudents,
            averageScore: avgScore.toFixed(1),
            activeCourses
        }
    }, [analyticsData, overallStudents])

    const analyticsCards = [
        {
            title: "Student Analytics",
            description: "Track learner progress, course completion, quiz performance, and engagement patterns.",
            icon: "fa-solid fa-user-graduate",
            to: "/analytics/student"
        },
        {
            title: "Program Analytics",
            description: "Analyze all programs with attendance, score, and performance trends across students.",
            icon: "fa-solid fa-book-open-reader",
            to: "/analytics/program"
        },
        {
            title: "Performance Analytics",
            description: "View leaderboard trends, class averages, and score distribution insights.",
            icon: "fa-solid fa-chart-line",
            to: "/analytics/performance"
        }
    ]

    return (
        <div className="dashboard-content analytics-dashboard-page">
            <div className="analytics-header-wrap mb-4">
                <h2 className="analytics-heading">Analytics Dashboard</h2>
                <p className="analytics-subheading mb-0">Get a quick view of learning trends and open detailed analytics modules.</p>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Total Students</span>
                        <h4>{summary.totalStudents}</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Average Score</span>
                        <h4>{summary.averageScore}%</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="analytics-summary-tile">
                        <span className="label">Active Courses</span>
                        <h4>{summary.activeCourses}</h4>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {analyticsCards.map((card) => (
                    <div className="col-12 col-lg-4" key={card.title}>
                        <Link to={card.to} className="analytics-nav-card text-decoration-none">
                            <div className="analytics-nav-icon">
                                <i className={card.icon}></i>
                            </div>
                            <h4>{card.title}</h4>
                            <p>{card.description}</p>
                            <span className="analytics-nav-link">Open details</span>
                        </Link>
                    </div>
                ))}
            </div>

            <AnalyticsChatAssistant />
        </div>
    )
}