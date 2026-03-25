import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute"
import Login from "./pages//auth/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Programs from "./pages/admin/Programs";
import Assignments from "./pages/student/Assignments";
import Performance from "./pages/student/Performance";
import CreateProgram from "./pages/admin/CreateProgram";
import StudentManagement from "./pages/admin/StudentManagement";
import ManageAssignments from "./pages/admin/ManageAssignments";
import ProgramDetails from "./pages/ProgramDetails";
import MyPrograms from "./pages/student/MyPrograms";
import UploadExcel from "./pages/admin/UploadExcel";

function App() {

    return (
            <Routes>
                <Route path="/" element={<Login />} />

                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute role="student">
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manage-students"
                    element={
                        <ProtectedRoute role="admin">
                            <StudentManagement />
                        </ProtectedRoute>
                    }
                />

                <Route path="/programs" element={<Programs />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/performance" element={<Performance />} />

                <Route path="/create-program" element={<CreateProgram />} />
                <Route path="/manage-assignments" element={<ManageAssignments />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/program-details/:id" element={<ProgramDetails />} />

                <Route path="/my-programs" element={<MyPrograms />} />

                <Route path="/upload-excel" element={<UploadExcel />} />
            </Routes>
    )

}

export default App;