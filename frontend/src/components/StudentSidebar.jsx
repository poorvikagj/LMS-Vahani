import { NavLink } from "react-router-dom"
import "./sidebar.css"

export default function StudentSidebar({ isOpen }) {

    const navItems = [
        { to: "/student-dashboard", icon: "fa-solid fa-table", label: "Dashboard" },
        // { to: "/programs", icon: "fa-solid fa-book-open", label: "Programs" },
        { to: "/my-programs", icon: "fa-solid fa-layer-group", label: "My Programs" },
        { to: "/assignments", icon: "fa-solid fa-tablet", label: "Assignments" },
        { to: "/performance", icon: "fa-solid fa-chart-column", label: "Performance" }
    ]

    return (

        <div className={`sidebar p-3 ${!isOpen ? "collapsed" : ""}`}>

            {/* 🔹 Header */}
            <div className="sidebar-panel-head mb-3">
                <div className="sidebar-panel-badge">S</div>
                <h4 className="sidebar-title mb-1">Student Panel</h4>
                <small className="sidebar-subtitle">Learning Dashboard</small>
            </div>

            {/* 🔹 Navigation */}
            <div className="sidebar-ops">

                <span className="sidebar-section-label">Main Navigation</span>

                <ul className="nav flex-column w-100 sidebar-menu-card">

                    {navItems.map((item) => (

                        <li className="nav-item sidebar-nav-item" key={item.to}>

                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `nav-link sidebar-nav-link ${isActive ? "is-active" : ""}`
                                }
                            >

                                {/* Icon */}
                                <span className="sidebar-icon-wrap">
                                    <i className={item.icon}></i>
                                </span>

                                {/* Text */}
                                <span className="sidebar-nav-text">
                                    {item.label}
                                </span>

                                {/* Arrow */}
                                <i className="fa-solid fa-angle-right sidebar-nav-arrow"></i>

                            </NavLink>

                        </li>

                    ))}

                </ul>

                {/* 🔹 Footer */}
                <div className="sidebar-footer-note">
                    <small>Student Learning Workspace</small>
                </div>

            </div>

        </div>
    )
}