import { Link } from "react-router-dom";
import './sidebar.css';

export default function StudentSidebar() {

    // const [isOpen, setIsOpen] = useState(true);

    // const toggleSidebar = (event) => {
    //     event.preventDefault();
    //     setIsOpen(!isOpen);
    // };

    return (

        <div className="sidebar p-3">

            <h4 className="mb-4 sidebar-heading"><i class="fa-solid fa-bars" ></i>Student Panel</h4>
            <hr />

            <div className="sidebar-ops"><ul className="nav flex-column">

                <li>
                    <Link className="nav-link" to="/student-dashboard">
                        <i class="fa-solid fa-table"></i>&nbsp;&nbsp;Dashboard
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/my-programs">
                        <i class="fa-solid fa-book-open"></i>&nbsp;&nbsp;My Programs
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/assignments">
                        <i class="fa-solid fa-tablet"></i>&nbsp;&nbsp;Assignments
                    </Link>
                </li>

                <li>
                    <Link className="nav-link" to="/performance">
                        <i class="fa-solid fa-chart-column"></i>&nbsp;&nbsp;Performance
                    </Link>
                </li>

            </ul></div>

        </div>

    )
}