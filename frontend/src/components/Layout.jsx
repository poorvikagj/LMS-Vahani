import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";

export default function Layout() {

    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => {
        setIsOpen(prev => !prev);
    };

    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    useEffect(() => {
        if (!role) {
            navigate("/");
        }
    }, [role, navigate]);

    if (!role) return null;

    return (
        <div>

            <span className="hamburger" onClick={toggleSidebar}>
                <i className="fa-solid fa-bars"></i>
            </span>

            {role === "admin"
                ? <AdminSidebar isOpen={isOpen} />
                : <StudentSidebar isOpen={isOpen} />
            }

            <Navbar />

            <div className={`dashboard ${!isOpen ? "opened" : ""}`}>
                <Outlet />
            </div>

        </div>
    );
}