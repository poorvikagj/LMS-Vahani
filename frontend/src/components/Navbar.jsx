import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService"
import logo from "../assets/vahani.png";
import { useState, useEffect } from "react";

export default function Navbar() {

    const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
    )
    const navigate = useNavigate();
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark")
        } else {
            document.body.classList.remove("dark")
        }

        localStorage.setItem("theme", darkMode ? "dark" : "light")
        }, [darkMode])
    const handleLogout = () => {               
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    }

    return (

        <nav className="navbar custom-navbar">

        {/* 🔹 LEFT: Logo */}
        <div className="nav-left">
            <a href="/">
                <img src={logo} alt="Vahani" className="logo" />
            </a>
        </div>

        {/* 🔹 CENTER: Title */}
        <div className="nav-center">
            <h3 className="title full">Learning Management System</h3>
            <h3 className="title short">LMS</h3>
        </div>

        {/* 🔹 RIGHT: Actions */}
        <div className="nav-right">

            {/* 🌙 Toggle */}
            <div 
                className={`theme-toggle ${darkMode ? "active" : ""}`}
                onClick={() => setDarkMode(prev => !prev)}
            >
                <div className="toggle-circle">
                    {darkMode ? "🌙" : "☀️"}
                </div>
            </div>

            {/* 🔴 Logout */}
            <button className="btn btn-danger logout-btn" onClick={handleLogout}>
                <span className="logout-text">Logout</span>
                <i className="fa fa-sign-out logout-icon"></i>
            </button>

        </div>

        </nav>
    )

}