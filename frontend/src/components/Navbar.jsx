import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService"
import logo from "../assets/vahani.png";

export default function Navbar() {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    }

    return (

        <nav className="navbar w-100 navbar-light bg-light shadow">

            <div className="container-fluid">

                <a className="navbar-brand" href="/">
                    <img src={logo} alt="Vahani" style={{ height: '40px' }} />
                </a>

                <span className="navbar-brand mb-0 h1">
                    <h3>Learning Management System</h3>
                </span>

                <button className="btn btn-danger" onClick={handleLogout}>Logout</button>

            </div>

        </nav>

    )

}