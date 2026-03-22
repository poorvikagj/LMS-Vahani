import { Link } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({toggleSidebar,isOpen}) {


    return (

        <div className={`sidebar p-3 ${!isOpen ? "collapsed" : ""}`} >

            <h4 className="mb-4"><span className="hamburger" onClick={toggleSidebar}><i class="fa-solid fa-bars"></i></span>Admin Panel</h4>
            <hr />
            <div className="sidebar-ops">
                <ul className="nav flex-column">

                    <li className="nav-item">
                        <Link className="nav-link" to="/admin-dashboard">
                            <i class="fa-solid fa-table"></i>&nbsp;&nbsp;Dashboard
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/programs">
                            <i class="fa-solid fa-book-open"></i>&nbsp;&nbsp;Programs
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/manage-students">
                            <i class="fa-solid fa-user"></i>&nbsp;&nbsp;Students
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/manage-assignments">
                            <i class="fa-solid fa-tablet"></i>&nbsp;&nbsp;Assignments
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/analytics">
                            <i class="fa-solid fa-chart-column"></i>&nbsp;&nbsp;Analytics
                        </Link>
                    </li>

                </ul>
            </div>

        </div>

    )

}