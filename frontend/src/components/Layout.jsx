import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";

export default function Layout({children}){

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
return(

<div className="d-flex">

{role==="admin" ? <AdminSidebar/> : <StudentSidebar/>}

<div className="flex-grow-1">

<Navbar/>

<div className="container mt-4">
{children}
</div>

</div>

</div>

)

}