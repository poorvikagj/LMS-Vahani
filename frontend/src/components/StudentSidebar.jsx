import { Link } from "react-router-dom";
import './sidebar.css';

export default function StudentSidebar({ isOpen }) {

    return (

        <div className={`sidebar p-3 ${!isOpen ? "collapsed" : ""}`}>
        
            <h4 className="mb-4 sidebar-heading">&nbsp;&nbsp;&nbsp;&nbsp;Student Panel</h4>
            <hr />

            <div className="sidebar-ops">
                <ul className="nav flex-column">

                    <li>
                        <Link className="nav-link" to="/student-dashboard">
                            <i className="fa-solid fa-table"></i>&nbsp;&nbsp;Dashboard
                        </Link>
                    </li>

                    <li>
                        <Link className="nav-link" to="/programs">
                            <i className="fa-solid fa-book-open"></i>&nbsp;&nbsp;Programs
                        </Link>
                    </li>

                    <li>
                        <Link className="nav-link" to="/my-programs">
                            <i className="fa-solid fa-book-open"></i>&nbsp;&nbsp;My Programs
                        </Link>
                    </li>

                    <li>
                        <Link className="nav-link" to="/assignments">
                            <i className="fa-solid fa-tablet"></i>&nbsp;&nbsp;Assignments
                        </Link>
                    </li>

                    <li>
                        <Link className="nav-link" to="/performance">
                            <i className="fa-solid fa-chart-column"></i>&nbsp;&nbsp;Performance
                        </Link>
                    </li>

                </ul>
            </div>

        </div>
    );
}