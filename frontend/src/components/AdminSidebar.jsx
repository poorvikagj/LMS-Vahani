import { NavLink } from "react-router-dom";
import './sidebar.css';
export default function Sidebar({ isOpen }) {

    const navItems = [
        { to: "/admin-dashboard", icon: "fa-solid fa-table", label: "Dashboard" },
        { to: "/programs", icon: "fa-solid fa-book-open", label: "Programs" },
        { to: "/manage-students", icon: "fa-solid fa-user", label: "Students" },
        { to: "/manage-assignments", icon: "fa-solid fa-tablet", label: "Assignments" },
        { to: "/analytics", icon: "fa-solid fa-chart-column", label: "Analytics" }
    ]

    return (

        <div className={`sidebar p-3 ${!isOpen ? "collapsed" : ""}`}>

            <div className="sidebar-panel-head mb-3">
                <div className="sidebar-panel-badge">A</div>
                <h4 className="sidebar-title mb-1">Admin Panel</h4>
                <small className="sidebar-subtitle">LMS Administration Console</small>
            </div>

            <div className="sidebar-ops">
                <span className="sidebar-section-label">Main Navigation</span>

                <ul className="nav flex-column w-100 sidebar-menu-card">
                    {navItems.map((item) => (
                        <li className="nav-item sidebar-nav-item" key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) => `nav-link sidebar-nav-link ${isActive ? "is-active" : ""}`}
                            >
                                <span className="sidebar-icon-wrap">
                                    <i className={item.icon}></i>
                                </span>
                                <span className="sidebar-nav-text">{item.label}</span>
                                <i className="fa-solid fa-angle-right sidebar-nav-arrow"></i>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer-note">
                    <small>Official LMS Admin Workspace</small>
                </div>
            </div>

        </div>
    );
}