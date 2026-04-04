import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";

export default function Layout() {

    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    // ✅ Detect screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true);
                setIsOpen(false); // auto close on mobile
            } else {
                setIsMobile(false);
                setIsOpen(true);
            }
        };

        handleResize(); // run once
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 🔐 Auth check
    useEffect(() => {
        if (!role) navigate("/");
    }, [role, navigate]);

    const toggleSidebar = () => {
        setIsOpen(prev => !prev);
    };

    if (!role) return null;

    return (
        <div>

            {/* 🍔 Hamburger */}
            <span className="hamburger" onClick={toggleSidebar}>
                <i className="fa-solid fa-bars"></i>
            </span>

            {/* 🧱 Sidebar */}
            {role === "admin"
                ? <AdminSidebar isOpen={isOpen} />
                : <StudentSidebar isOpen={isOpen} />
            }

            {/* 🌑 Overlay (mobile only) */}
            {isMobile && isOpen && (
                <div
                    className="overlay"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            <Navbar />

            {/* 📄 Main Content */}
            <div className={`dashboard ${!isOpen ? "opened" : ""}`}>
                <Outlet />
            </div>

        </div>
    );
}