import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";

export default function Layout({ children }) {

    let [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = (event) => {
        event.preventDefault();
        setIsOpen(!isOpen);
    };

    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    useEffect(() => {
        if (!role) {
            navigate("/");
        }
    }, [role, navigate]);

    if (!role) {
        return null;
    }
    return (

        <div>

            {role === "admin" ? <AdminSidebar toggleSidebar={toggleSidebar} isOpen={isOpen} /> : <StudentSidebar toggleSidebar={toggleSidebar} isOpen={isOpen}/>}

            <div>

                <Navbar />

            </div>

        </div>

    )

}