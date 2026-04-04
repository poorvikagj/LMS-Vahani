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

import StudentDashboard from "./pages/student/StudentDashboard";
import Assignments from "./pages/student/Assignments";
import Performance from "./pages/student/Performance";
import MyPrograms from "./pages/student/MyPrograms";


function App() {

    return (
        <>
            {/* ✅ FIXED POSITION */}
            <ToastContainer position="top-right" autoClose={2000} />

            <Routes>

                <Route path="/" element={<Login />} />

                <Route element={<Layout />}>

                    {/* ADMIN */}
                    <Route element={<ProtectedRoute role="admin" />}>

                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/manage-students" element={<StudentManagement />} />
                        <Route path="/create-program" element={<CreateProgram />} />
                        <Route path="/manage-assignments" element={<ManageAssignments />} />
                        <Route path="/upload-excel" element={<UploadExcel />} />
                        <Route path="/grade/:id" element={<GradeAssignments />} />
                        <Route path="/programs/:id" element={<ProgramDetails />} />
                        <Route path="/students/:id/report" element={<StudentReport />} />
                        <Route path="/analytics" element={< Analytics/>} />

                    </Route>

                    {/* STUDENT */}
                    <Route element={<ProtectedRoute role="student" />}>

                        <Route path="/student-dashboard" element={<StudentDashboard />} />
                        <Route path="/assignments" element={<Assignments />} />
                        <Route path="/performance" element={<Performance />} />
                        <Route path="/my-programs" element={<MyPrograms />} />

                    </Route>

                    {/* COMMON */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/programs" element={<Programs />} />
                    </Route>

                </Route>

            </Routes>
        </>
    )
}

export default App;