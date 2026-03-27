import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoute({ role }) {

    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("role")

    // Not logged in
    if (!token) {
        return <Navigate to="/" />
    }

    // Role mismatch
    if (role && role !== userRole) {
        return <Navigate to="/" />
    }

    // If used as wrapper → Outlet
    return <Outlet />
}