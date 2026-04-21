import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ProtectedRoute from "./utils/ProtectedRoute"

import Login from "./pages/auth/Login";
import Layout from "./components/Layout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Programs from "./pages/admin/Programs";
import CreateProgram from "./pages/admin/CreateProgram";
import StudentManagement from "./pages/admin/StudentManagement";
import ManageAssignments from "./pages/admin/ManageAssignments";
import UploadExcel from "./pages/admin/UploadExcel";
import ProgramDetails from "./pages/admin/ProgramDetails";
import GradeAssignments from "./pages/admin/GradeAssignments"
import StudentReport from "./pages/admin/StudentReport"
import Analytics from "./pages/admin/Analytics";
import StudentAnalyticsPage from "./pages/admin/StudentAnalyticsPage"
import ProgramAnalyticsPage from "./pages/admin/ProgramAnalyticsPage"
import PerformanceAnalyticsPage from "./pages/admin/PerformanceAnalyticsPage"
import AllSubmissions from "./pages/admin/AllSubmissions"
import NotificationsManagement from "./pages/admin/NotificationsManagement"
import CertificatesManagement from "./pages/admin/CertificatesManagement"
import AttendanceSessions from "./pages/admin/AttendanceSessions"

import StudentDashboard from "./pages/student/StudentDashboard";
import Assignments from "./pages/student/Assignments";
import Performance from "./pages/student/Performance";
import MyPrograms from "./pages/student/MyPrograms";
import MyCertificates from "./pages/student/MyCertificates";
import Leaderboard from "./pages/student/Leaderboard";
import LiveAttendance from "./pages/student/LiveAttendance";
import ChangePassword from "./pages/common/ChangePassword";
import VerifyCertificate from "./pages/common/VerifyCertificate";
import Messages from "./pages/common/Messages";
import HomePage from "./pages/public/HomePage"


function App() {

    return (
        <>
            {/* ✅ FIXED POSITION */}
            <ToastContainer position="top-right" autoClose={2000} />

            <Routes>

                <Route path="/" element={<Login />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/verify-certificate/:code" element={<VerifyCertificate />} />

                <Route element={<Layout />}>

                    {/* ADMIN */}
                    <Route element={<ProtectedRoute role="admin" />}>

                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/manage-students" element={<StudentManagement />} />
                        <Route path="/create-program" element={<CreateProgram />} />
                        <Route path="/manage-assignments" element={<ManageAssignments />} />
                        <Route path="/assignment-submissions" element={<AllSubmissions />} />
                        <Route path="/notifications" element={<NotificationsManagement />} />
                        <Route path="/certificates-management" element={<CertificatesManagement />} />
                        <Route path="/attendance-sessions" element={<AttendanceSessions />} />
                        <Route path="/upload-excel" element={<UploadExcel />} />
                        <Route path="/grade/:id" element={<GradeAssignments />} />
                        <Route path="/programs/:id" element={<ProgramDetails />} />
                        <Route path="/students/:id/report" element={<StudentReport />} />
                        <Route path="/analytics" element={< Analytics/>} />
                        <Route path="/analytics/student" element={<StudentAnalyticsPage />} />
                        <Route path="/analytics/program" element={<ProgramAnalyticsPage />} />
                        <Route path="/analytics/performance" element={<PerformanceAnalyticsPage />} />
                        <Route path="/programs" element={<Programs />} />

                    </Route>

                    {/* STUDENT */}
                    <Route element={<ProtectedRoute role="student" />}>

                        <Route path="/student-dashboard" element={<StudentDashboard />} />
                        <Route path="/assignments" element={<Assignments />} />
                        <Route path="/performance" element={<Performance />} />
                        <Route path="/my-programs" element={<MyPrograms />} />
                        <Route path="/my-certificates" element={<MyCertificates />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/live-attendance" element={<LiveAttendance />} />

                    </Route>

                    {/* COMMON */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/change-password" element={<ChangePassword />} />
                        <Route path="/messages" element={<Messages />} />
                    </Route>

                </Route>

            </Routes>
        </>
    )
}

export default App;