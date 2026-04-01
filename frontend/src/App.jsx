import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute"

import Login from "./pages/auth/Login";
import Layout from "./components/Layout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Programs from "./pages/admin/Programs";
import CreateProgram from "./pages/admin/CreateProgram";
import StudentManagement from "./pages/admin/StudentManagement";
import ManageAssignments from "./pages/admin/ManageAssignments";
import UploadExcel from "./pages/admin/UploadExcel";

import StudentDashboard from "./pages/student/StudentDashboard";
import Assignments from "./pages/student/Assignments";
import Performance from "./pages/student/Performance";
import MyPrograms from "./pages/student/MyPrograms";
import ProgramDetails from "./pages/ProgramDetails";

function App() {

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout />}>
            <Route element={<ProtectedRoute role="admin" />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/manage-students" element={<StudentManagement />} />
                <Route path="/create-program" element={<CreateProgram />} />
                <Route path="/manage-assignments" element={<ManageAssignments />} />
                <Route path="/upload-excel" element={<UploadExcel />} />
            </Route>
                
            <Route element={<ProtectedRoute role="student" />}>
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/my-programs" element={<MyPrograms />} />
                </Route>  
                
            <Route element={<ProtectedRoute />}>
                <Route path="/programs" element={<Programs />} />
                <Route path="/program-details/:id" element={<ProgramDetails />} />
            </Route>
        </Route>
        </Routes>
    )

}

export default App;