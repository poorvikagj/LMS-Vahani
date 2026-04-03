import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService"
import logo from "../assets/vahani.png";

export default function Navbar() {

    const navigate = useNavigate();

    const handleLogout = () => {                //You have imported the logout function from the services and havent used but wrote a function again
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    }

    return (

        <nav className="navbar w-100 navbar-light bg-light border" style={{position:"fixed",top:"0px"}}>

            <a className="navbar-brand ms-5" href="/">
                <img src={logo} alt="Vahani" style={{ height: '40px' }} />
            </a>

            <h3 style={{ color: "#0B0D47" }} className="mt-2"><b>Learning Management System</b></h3>

            <button className="btn btn-danger me-3" onClick={handleLogout}><b>Logout</b></button>

        </nav>

    )

}