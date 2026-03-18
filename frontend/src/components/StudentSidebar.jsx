import { Link } from "react-router-dom";

export default function StudentSidebar() {

    return (

        <div className="sidebar p-3" style={{ width: "250px",position:"fixed",top:"90px"}}>

            <h4 className="mb-4">Student Panel</h4>

            <ul className="nav flex-column">

                <li>
                    <Link className="nav-link" to="/student-dashboard">
                        Dashboard
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/my-programs">
                        My Programs
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/assignments">
                        Assignments
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/performance">
                        Performance
                    </Link>
                </li>

            </ul>

        </div>

    )
}