import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService"

export default function Navbar() {
    
const navigate = useNavigate();
    
const handleLogout = ()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
}

return(

<nav className="navbar navbar-light bg-light shadow">

<div className="container-fluid">

<span className="navbar-brand mb-0 h1">
Learning Management System
</span>

<button
className="btn btn-danger"
onClick={handleLogout}
>
Logout
</button>

</div>

</nav>

)

}